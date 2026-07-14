import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from services import auth_service
from services.auth_service import (
    FeishuAuthService,
    FeishuJsapiService,
    WechatAuthService,
)


class FakeResponse:
    def __init__(self, body):
        self.body = body

    def raise_for_status(self):
        return None

    def json(self):
        return self.body


def test_feishu_uses_oauth_v2_then_user_info(monkeypatch):
    calls = []

    def fake_post(url, json, timeout):
        calls.append(("POST", url, json))
        return FakeResponse({"access_token": "user-token"})

    def fake_get(url, headers, timeout):
        calls.append(("GET", url, headers))
        return FakeResponse(
            {
                "code": 0,
                "data": {"open_id": "ou_123", "name": "飞书测试用户"},
            }
        )

    monkeypatch.setattr(auth_service.requests, "post", fake_post)
    monkeypatch.setattr(auth_service.requests, "get", fake_get)
    identity = FeishuAuthService(
        "app-id", "app-secret", "https://open.feishu.cn/open-apis"
    ).exchange_code("auth-code")

    assert calls[0] == (
        "POST",
        "https://open.feishu.cn/open-apis/authen/v2/oauth/token",
        {
            "grant_type": "authorization_code",
            "client_id": "app-id",
            "client_secret": "app-secret",
            "code": "auth-code",
        },
    )
    assert calls[1][0:2] == (
        "GET",
        "https://open.feishu.cn/open-apis/authen/v1/user_info",
    )
    assert calls[1][2]["Authorization"] == "Bearer user-token"
    assert identity["external_id"] == "feishu:ou_123"


def test_wechat_uses_jscode2session(monkeypatch):
    captured = {}

    def fake_get(url, params, timeout):
        captured.update(url=url, params=params)
        return FakeResponse({"openid": "wx-open-id", "unionid": "union-id"})

    monkeypatch.setattr(auth_service.requests, "get", fake_get)
    identity = WechatAuthService(
        "wx-app", "wx-secret", "https://api.weixin.qq.com"
    ).exchange_code("wx-code")

    assert captured["url"] == "https://api.weixin.qq.com/sns/jscode2session"
    assert captured["params"] == {
        "appid": "wx-app",
        "secret": "wx-secret",
        "js_code": "wx-code",
        "grant_type": "authorization_code",
    }
    assert identity["external_id"] == "wechat:wx-open-id"


def test_feishu_jsapi_ticket_is_fetched_and_cached(monkeypatch):
    calls = []
    clock = [1000]

    def fake_post(url, json, timeout, headers=None):
        calls.append((url, json, headers))
        if url.endswith("/auth/v3/tenant_access_token/internal"):
            return FakeResponse(
                {"code": 0, "tenant_access_token": "tenant-token", "expire": 7200}
            )
        return FakeResponse(
            {"code": 0, "data": {"ticket": "jsapi-ticket", "expire_in": 7200}}
        )

    FeishuJsapiService.clear_cache()
    monkeypatch.setattr(auth_service.requests, "post", fake_post)
    service = FeishuJsapiService(
        "app-id",
        "app-secret",
        "https://open.feishu.cn/open-apis",
        now=lambda: clock[0],
    )

    assert service.ticket() == "jsapi-ticket"
    assert service.ticket() == "jsapi-ticket"
    assert len(calls) == 2
    assert calls[0][0].endswith("/auth/v3/tenant_access_token/internal")
    assert calls[1][0].endswith("/jssdk/ticket/get")
    assert calls[1][2]["Authorization"] == "Bearer tenant-token"

    clock[0] += 7000
    assert service.ticket() == "jsapi-ticket"
    assert len(calls) == 4
