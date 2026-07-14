import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import verify_deployment


def response_for(backend="postgresql"):
    def fake_request(base_url, path, method="GET"):
        assert base_url == "https://fashion.example.com"
        if path == "/":
            return 200, {}, b'<div id="root"></div>'
        if path == "/api/live":
            return 200, {}, b'{"success":true,"status":"alive"}'
        if path == "/api/ready":
            return 200, {}, b'{"success":true,"ready":true,"status":"ready"}'
        if path == "/api/health":
            body = {
                "success": True,
                "ready": True,
                "components": {
                    "database": {
                        "status": "ok",
                        "backend": backend,
                        "schema": "ok",
                    },
                    "storage": {
                        "status": "ok",
                        "backend": "cos",
                        "persistent": True,
                    },
                    "ai": {"status": "ok"},
                    "feishu": {"status": "ok"},
                },
            }
            return 200, {}, json.dumps(body).encode()
        if path in {"/api/me", "/api/history"}:
            return 401, {}, b"{}"
        if path == "/api/auth/dev-login" and method == "POST":
            body = {"error": {"code": "DEV_LOGIN_DISABLED"}}
            return 404, {}, json.dumps(body).encode()
        raise AssertionError((path, method))

    return fake_request


def test_deployment_verifier_requires_managed_production_services(monkeypatch):
    monkeypatch.setattr(verify_deployment, "request", response_for())
    health = verify_deployment.verify_once("https://fashion.example.com")
    assert health["components"]["storage"]["backend"] == "cos"

    monkeypatch.setattr(verify_deployment, "request", response_for("sqlite"))
    with pytest.raises(RuntimeError, match="数据库"):
        verify_deployment.verify_once("https://fashion.example.com")
