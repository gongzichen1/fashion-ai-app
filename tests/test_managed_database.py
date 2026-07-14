import os
import sys
import uuid

import pytest
from sqlalchemy.exc import IntegrityError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from models.data_store import DataStore


@pytest.mark.parametrize(
    ("environment_name", "expected_backend"),
    [
        ("TEST_POSTGRES_URL", "postgresql"),
        ("TEST_MYSQL_URL", "mysql"),
    ],
)
def test_managed_database_crud_identity_and_owner_isolation(
    environment_name, expected_backend
):
    database_url = os.getenv(environment_name)
    if not database_url:
        pytest.skip(f"{environment_name} is only configured in integration CI")

    store = DataStore(database_url=database_url)
    suffix = uuid.uuid4().hex
    external_id = f"feishu:integration-{suffix}"
    try:
        user_id = store.insert(
            "users", {"external_id": external_id, "provider": "feishu"}
        )
        assert store.find_one("users", {"external_id": external_id})["id"] == user_id
        with pytest.raises(IntegrityError):
            store.insert("users", {"external_id": external_id, "provider": "feishu"})

        result_id = store.insert(
            "results",
            {
                "owner_user_id": user_id,
                "garment_type": "集成测试上衣",
            },
        )
        other_id = store.insert(
            "results",
            {
                "owner_user_id": f"other-{suffix}",
                "garment_type": "其他用户上衣",
            },
        )
        own_results = store.find_many("results", {"owner_user_id": user_id})
        assert [item["id"] for item in own_results] == [result_id]
        assert (
            store.find_one("results", {"id": other_id, "owner_user_id": user_id})
            is None
        )
        assert store.update_one(
            "results",
            {"id": result_id, "owner_user_id": user_id},
            {"garment_type": "更新后的上衣"},
        )
        assert (
            store.find_one("results", {"id": result_id})["garment_type"]
            == "更新后的上衣"
        )
        assert store.delete_one("results", {"id": result_id, "owner_user_id": user_id})
        content_hash = "c" * 64
        catalog_id = store.insert(
            "catalog_items",
            {
                "content_hash": content_hash,
                "review_status": "approved",
                "category": "下装",
                "garment_type": "直筒裤",
            },
        )
        approved = store.find_many(
            "catalog_items",
            {"review_status": "approved", "category": "下装"},
        )
        assert [item["id"] for item in approved] == [catalog_id]
        with pytest.raises(IntegrityError):
            store.insert(
                "catalog_items",
                {"content_hash": content_hash, "review_status": "approved"},
            )
        assert store.backend == expected_backend
        assert store.ping() is True
    finally:
        store.metadata.drop_all(store.engine)
