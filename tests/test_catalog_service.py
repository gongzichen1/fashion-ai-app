import os
import shutil
import sys

import pytest
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from models.data_store import DataStore
from services.catalog_service import (
    enrich_recommendations,
    import_catalog_directory,
    inventory_directory,
)
from services.object_storage import LocalObjectStorage


def patterned_image(path):
    image = Image.new("RGB", (128, 128))
    image.putdata(
        [
            ((x * 11) % 256, (y * 17) % 256, ((x + y) * 7) % 256)
            for y in range(128)
            for x in range(128)
        ]
    )
    image.save(path)


def test_inventory_deduplicates_and_rejects_test_assets(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    patterned_image(source / "coat.jpg")
    shutil.copy2(source / "coat.jpg", source / "coat-copy.jpg")
    Image.new("RGB", (1, 1), "white").save(source / "pixel.png")

    inventory = inventory_directory(source)

    assert inventory["total_files"] == 3
    assert inventory["unique_items"] == 2
    assert inventory["candidates"] == 1
    assert inventory["rejected_test_assets"] == 1
    candidate = next(
        item
        for item in inventory["items"]
        if item["review_status"] == "pending_rights_review"
    )
    assert candidate["duplicate_count"] == 2


def test_catalog_import_is_pending_by_default_and_idempotent(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    patterned_image(source / "coat.jpg")
    Image.new("RGB", (1, 1), "white").save(source / "pixel.png")
    store = DataStore(str(tmp_path / "db"))
    storage = LocalObjectStorage(str(tmp_path / "objects"))

    first = import_catalog_directory(store, storage, source)
    second = import_catalog_directory(store, storage, source)

    assert first["created"] == 1
    assert first["rejected"] == 1
    assert second["existing"] == 1
    item = store.scan("catalog_items")[0]
    assert item["review_status"] == "pending_rights_review"
    assert (tmp_path / "objects" / item["imageKey"]).exists()

    with pytest.raises(ValueError, match="授权"):
        import_catalog_directory(
            store, storage, source, review_status="approved", rights_confirmed=False
        )

    content_hash = next(
        item["content_hash"]
        for item in inventory_directory(source)["items"]
        if item["review_status"] == "pending_rights_review"
    )
    with pytest.raises(ValueError, match="license_status"):
        import_catalog_directory(
            DataStore(str(tmp_path / "approved-db")),
            LocalObjectStorage(str(tmp_path / "approved-objects")),
            source,
            rights_confirmed=True,
            metadata_by_hash={
                content_hash: {
                    "review_status": "approved",
                    "category": "外套",
                    "garment_type": "风衣",
                }
            },
        )

    approved_store = DataStore(str(tmp_path / "approved-db-2"))
    approved = import_catalog_directory(
        approved_store,
        LocalObjectStorage(str(tmp_path / "approved-objects-2")),
        source,
        rights_confirmed=True,
        metadata_by_hash={
            content_hash: {
                "review_status": "approved",
                "license_status": "approved",
                "category": "外套",
                "garment_type": "风衣",
                "styles": ["通勤"],
            }
        },
    )
    assert approved["created"] == 1
    approved_item = approved_store.scan("catalog_items")[0]
    assert approved_item["category"] == "外套"
    assert approved_item["garment_type"] == "风衣"
    assert approved_item["license_status"] == "approved"


def test_recommendation_uses_only_structurally_matching_approved_catalog_item():
    recommendations = [
        {"id": "rec-1", "type": "下装", "name": "直筒裤", "scenes": ["通勤"]}
    ]
    catalog = [
        {
            "id": "pending",
            "review_status": "pending_rights_review",
            "category": "下装",
        },
        {
            "id": "approved",
            "review_status": "approved",
            "category": "下装",
            "scenes": ["通勤"],
        },
    ]

    result = enrich_recommendations(recommendations, catalog)

    assert result[0]["catalogItemId"] == "approved"
    assert result[0]["image"] == "/api/catalog/approved/image"
