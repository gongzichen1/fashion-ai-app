import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from app import production_config_errors


def valid_settings():
    return {
        "SECRET_KEY": "x" * 48,
        "STORAGE_BACKEND": "cos",
        "COS_SECRET_ID": "configured",
        "COS_SECRET_KEY": "configured",
        "COS_REGION": "ap-shanghai",
        "COS_BUCKET": "private-bucket",
        "FEISHU_APP_ID": "cli_test",
        "FEISHU_APP_SECRET": "configured",
        "FEISHU_WEB_ORIGINS": "https://fashion.example.com",
        "AI_API_URL": "https://ai.example.com/v1",
        "AI_API_KEY": "configured",
        "AI_MODEL": "vision-model",
        "FEISHU_DEV_LOGIN_ENABLED": False,
        "AI_DEMO_MODE": False,
        "CORS_ORIGINS": "https://fashion.example.com",
    }


def test_valid_production_configuration_has_no_errors():
    assert production_config_errors(valid_settings(), "postgresql") == []


def test_local_storage_sqlite_and_bypass_modes_block_production():
    settings = valid_settings()
    settings.update(
        STORAGE_BACKEND="local",
        FEISHU_DEV_LOGIN_ENABLED=True,
        AI_DEMO_MODE=True,
        CORS_ORIGINS="*",
    )

    errors = production_config_errors(settings, "sqlite")

    assert any("SQLite" in item for item in errors)
    assert any("私有 COS" in item for item in errors)
    assert any("FEISHU_DEV_LOGIN_ENABLED" in item for item in errors)
    assert any("AI_DEMO_MODE" in item for item in errors)
    assert any("CORS_ORIGINS" in item for item in errors)
