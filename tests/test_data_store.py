import json
import os
import sqlite3
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from models.data_store import DataStore


def test_database_url_normalization_supports_managed_databases():
    assert (
        DataStore.normalize_database_url("postgres://user:pass@db/app")
        == "postgresql+psycopg://user:pass@db/app"
    )
    assert (
        DataStore.normalize_database_url("mysql://user:pass@db/app")
        == "mysql+pymysql://user:pass@db/app"
    )
    explicit = "postgresql+psycopg://user:pass@db/app"
    assert DataStore.normalize_database_url(explicit) == explicit


def test_existing_sqlite_users_are_migrated_to_unique_external_identity(tmp_path):
    database = tmp_path / "legacy.db"
    connection = sqlite3.connect(database)
    connection.execute("""CREATE TABLE users (
            id TEXT PRIMARY KEY,
            owner_user_id TEXT,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )""")
    connection.execute(
        "INSERT INTO users VALUES (?, ?, ?, ?, ?)",
        (
            "user-1",
            None,
            json.dumps({"external_id": "feishu:ou_legacy", "name": "旧用户"}),
            "2026-01-01T00:00:00+00:00",
            "2026-01-01T00:00:00+00:00",
        ),
    )
    connection.commit()
    connection.close()

    store = DataStore(database_url=f"sqlite:///{database}")

    user = store.find_one("users", {"external_id": "feishu:ou_legacy"})
    assert user["id"] == "user-1"
    assert user["name"] == "旧用户"
    assert store.backend == "sqlite"


def test_database_health_checks_required_schema(tmp_path):
    store = DataStore(str(tmp_path))

    assert store.health() == {"status": "ok", "backend": "sqlite", "schema": "ok"}

    with store.engine.begin() as connection:
        connection.exec_driver_sql("DROP TABLE feedback")

    assert store.health() == {
        "status": "error",
        "backend": "sqlite",
        "schema": "error",
    }
