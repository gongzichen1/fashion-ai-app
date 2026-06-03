import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from api import routes
from app import create_app
from models.data_store import DataStore

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
    return app.test_client()


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
                '{"preferred_styles":["温柔"],' '"common_scenes":["日常"],"budget":"中等"}'
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
