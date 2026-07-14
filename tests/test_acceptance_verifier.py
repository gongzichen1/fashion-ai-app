import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from verify_two_account_isolation import (
    AcceptanceError,
    ApiClient,
    verify_production_dependencies,
)


class HealthClient:
    def __init__(self, database="postgresql", storage_status="ok"):
        self.database = database
        self.storage_status = storage_status

    def request(self, method, path, expected):
        assert (method, path, expected) == ("GET", "/api/health", 200)
        return 200, {
            "status": "ready",
            "components": {
                "database": {"status": "ok", "backend": self.database},
                "storage": {
                    "status": self.storage_status,
                    "backend": "cos",
                    "persistent": True,
                },
                "ai": {"status": "ok"},
                "feishu": {"status": "ok"},
            },
        }


def test_acceptance_requires_managed_database_and_live_cos():
    verify_production_dependencies(HealthClient())

    with pytest.raises(AcceptanceError, match="数据库"):
        verify_production_dependencies(HealthClient(database="sqlite"))
    with pytest.raises(AcceptanceError, match="COS"):
        verify_production_dependencies(HealthClient(storage_status="error"))


def test_api_client_loads_raw_cookie_and_storage_state(tmp_path):
    raw = tmp_path / "raw.cookie"
    raw.write_text("Cookie: session=raw-secret", encoding="utf-8")
    raw_client = ApiClient("https://fashion.example.com", raw, "账号 A")
    assert raw_client.session.headers["Cookie"] == "session=raw-secret"

    state = tmp_path / "state.json"
    state.write_text(
        json.dumps(
            {
                "cookies": [
                    {
                        "name": "session",
                        "value": "state-secret",
                        "domain": "fashion.example.com",
                        "path": "/",
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    state_client = ApiClient("https://fashion.example.com", state, "账号 B")
    assert state_client.session.cookies.get("session") == "state-secret"

    with pytest.raises(AcceptanceError, match="HTTPS"):
        ApiClient("http://fashion.example.com", raw, "账号 A")
