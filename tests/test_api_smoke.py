import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from api import routes
from app import create_app
from models.data_store import DataStore
from services.ai_service import AIServiceError

from config import Config


class FakeAIService:
    def analyze_image(self, image_base64, style_preference=None):
        return {
            "garment_type": "针织衫",
            "category": "上装",
            "color_name": "奶油白",
            "styles": ["温柔", "简约"],
            "pattern": "纯色",
            "material": "针织",
            "length": "常规",
            "suitable_scenes": ["日常", "通勤"],
            "suitable_seasons": ["春", "秋"],
            "description": "测试服装",
        }

    def generate_recommendations(self, analysis_result, style_preference=None):
        return {
            "overall_style": "奶油针织风",
            "style_tips": "保持色系统一。",
            "recommendations": [
                {
                    "type": "下装",
                    "name": "高腰直筒裤",
                    "reason": "协调比例",
                    "scenes": ["日常"],
                    "tags": ["显高"],
                }
            ],
        }


class FakeWeatherResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "current": {
                "temperature_2m": 18.4,
                "weather_code": 61,
                "wind_speed_10m": 8,
                "time": "2026-05-27T12:00",
            }
        }


def fake_weather_get(*args, **kwargs):
    return FakeWeatherResponse()


def make_client(tmp_path, monkeypatch):
    monkeypatch.setattr(routes, "ai_service", FakeAIService())
    monkeypatch.setattr(routes.requests, "get", fake_weather_get)
    monkeypatch.setattr(routes, "db", DataStore(str(tmp_path)))
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    monkeypatch.setattr(Config, "UPLOAD_FOLDER", str(upload_dir))
    app = create_app("testing")
    client = app.test_client()
    login = client.post("/api/auth/dev-login", json={"userId": "smoke-user"})
    assert login.status_code == 200
    return client


def one_pixel_png():
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
        b"\x00\x00\x00\x0cIDATx\x9cc``\x00\x00\x00\x04\x00\x01"
        b"\xf6\x178U\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def test_weather_endpoint(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)

    bad = client.get("/api/weather?latitude=200&longitude=121.5")
    assert bad.status_code == 400

    res = client.get("/api/weather?latitude=31.2&longitude=121.5")
    assert res.status_code == 200
    assert res.get_json()["data"]["condition"] == "小雨"
    assert "带伞" in res.get_json()["data"]["outfitAdvice"]


def test_analyze_result_and_history(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)

    analyze = client.post(
        "/api/analyze",
        data={
            "image": (io.BytesIO(one_pixel_png()), "camera-temp"),
            "style_preference": (
                '{"preferred_styles":["温柔"],'
                '"common_scenes":["日常"],"budget":"中等"}'
            ),
        },
        content_type="multipart/form-data",
    )
    assert analyze.status_code == 200
    body = analyze.get_json()
    assert body["success"] is True
    result_id = body["data"]["id"]

    detail = client.get(f"/api/result/{result_id}")
    assert detail.status_code == 200
    assert detail.get_json()["data"]["overallStyle"] == "奶油针织风"

    history = client.get("/api/history")
    assert history.status_code == 200
    assert history.get_json()["data"][0]["id"] == result_id


def test_user_data_isolation(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    user_id = client.get("/api/me").get_json()["data"]["id"]
    routes.db.insert(
        "results",
        {"id": "analysis-1", "owner_user_id": user_id, "image": "/uploads/a.png"},
    )
    created = client.post("/api/favorites", json={"analysis_id": "analysis-1"})
    assert created.status_code == 201
    assert created.get_json()["data"]["image"] == "/uploads/a.png"

    client.post("/api/auth/logout")
    client.post("/api/auth/dev-login", json={"userId": "another-user"})
    assert client.get("/api/favorites").get_json()["data"] == []
    assert client.delete("/api/favorites/analysis-1").get_json()["deleted"] is False


def test_analyze_reports_ai_failure_instead_of_fake_success(tmp_path, monkeypatch):
    class FailingAIService:
        def analyze_image(self, image_base64, style_preference=None):
            raise AIServiceError("AI_ANALYSIS_FAILED")

    client = make_client(tmp_path, monkeypatch)
    monkeypatch.setattr(routes, "ai_service", FailingAIService())
    response = client.post(
        "/api/analyze",
        data={"image": (io.BytesIO(one_pixel_png()), "garment.png")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 503
    body = response.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "AI_ANALYSIS_FAILED"
    assert body["requestId"]


def test_auth_required(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    client.post("/api/auth/logout")
    assert client.get("/api/history").status_code == 401


def test_uploaded_image_requires_owner_session(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    response = client.post(
        "/api/analyze",
        data={"image": (io.BytesIO(one_pixel_png()), "garment.png")},
        content_type="multipart/form-data",
    )
    image_url = response.get_json()["data"]["image"]

    assert client.get(image_url).status_code == 200
    client.post("/api/auth/logout")
    assert client.get(image_url).status_code == 404


def test_same_origin_web_build_and_deep_link(tmp_path):
    web_dist = tmp_path / "web-dist"
    web_dist.mkdir()
    (web_dist / "index.html").write_text("<h1>智搭飞书版</h1>", encoding="utf-8")
    app = create_app("testing")
    app.config["WEB_DIST_DIR"] = str(web_dist)
    client = app.test_client()

    assert "智搭飞书版" in client.get("/").get_data(as_text=True)
    assert "智搭飞书版" in client.get("/shared/result-id").get_data(as_text=True)


def test_wechat_login_creates_session_without_leaking_provider_error(
    tmp_path, monkeypatch
):
    class FakeWechatAuth:
        def exchange_code(self, code):
            assert code == "wx-code"
            return {
                "external_id": "wechat:open-id",
                "provider": "wechat",
                "open_id": "open-id",
                "name": "微信用户",
                "avatar_url": "",
            }

    monkeypatch.setattr(routes, "db", DataStore(str(tmp_path)))
    monkeypatch.setattr(routes, "_wechat_auth_service", lambda: FakeWechatAuth())
    app = create_app("testing")
    client = app.test_client()
    login = client.post("/api/auth/wechat/login", json={"code": "wx-code"})
    assert login.status_code == 200
    assert client.get("/api/history").status_code == 200


def test_wechat_login_error_is_sanitized(tmp_path, monkeypatch):
    from services.auth_service import WechatAuthError

    class FailingWechatAuth:
        def exchange_code(self, code):
            raise WechatAuthError("upstream secret detail")

    monkeypatch.setattr(routes, "db", DataStore(str(tmp_path)))
    monkeypatch.setattr(routes, "_wechat_auth_service", lambda: FailingWechatAuth())
    app = create_app("testing")
    response = app.test_client().post("/api/auth/wechat/login", json={"code": "bad"})
    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "WECHAT_LOGIN_FAILED"
    assert "secret detail" not in response.get_data(as_text=True)


def test_feishu_login_reuses_identity_and_sets_protected_session(tmp_path, monkeypatch):
    class FakeFeishuAuth:
        def exchange_code(self, code):
            return {
                "external_id": "feishu:ou_same_user",
                "provider": "feishu",
                "open_id": "ou_same_user",
                "name": f"飞书用户-{code}",
                "avatar_url": "",
            }

    store = DataStore(str(tmp_path))
    monkeypatch.setattr(routes, "db", store)
    monkeypatch.setattr(routes, "_auth_service", lambda: FakeFeishuAuth())
    app = create_app("testing")
    client = app.test_client()

    first = client.post("/api/auth/feishu/login", json={"code": "first"})
    first_id = first.get_json()["data"]["id"]
    second = client.post("/api/auth/feishu/login", json={"code": "second"})

    assert second.get_json()["data"]["id"] == first_id
    assert len(store.scan("users")) == 1
    cookie = second.headers["Set-Cookie"]
    assert "HttpOnly" in cookie
    assert "SameSite=Lax" in cookie
