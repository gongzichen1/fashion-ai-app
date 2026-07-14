import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from models.data_store import DataStore
from services.lifecycle_service import cleanup_expired_images
from services.object_storage import LocalObjectStorage


def test_cleanup_deletes_unreferenced_expired_image(tmp_path):
    store = DataStore(str(tmp_path / "db"))
    storage = LocalObjectStorage(str(tmp_path / "uploads"))
    source = tmp_path / "source.jpg"
    source.write_bytes(b"image")
    storage.upload(str(source), "user-1/expired.jpg")
    store.insert(
        "results",
        {
            "id": "result-1",
            "owner_user_id": "user-1",
            "image": "/uploads/user-1/expired.jpg",
            "imageKey": "user-1/expired.jpg",
            "expiresAt": 10,
        },
    )

    stats = cleanup_expired_images(store, storage, now=20)

    assert stats["deleted"] == 1
    assert not (tmp_path / "uploads" / "user-1" / "expired.jpg").exists()
    assert store.find_one("results", {"id": "result-1"})["image"] == ""


def test_cleanup_retains_favorited_image(tmp_path):
    store = DataStore(str(tmp_path / "db"))
    storage = LocalObjectStorage(str(tmp_path / "uploads"))
    source = tmp_path / "source.jpg"
    source.write_bytes(b"image")
    storage.upload(str(source), "user-1/favorite.jpg")
    result = {
        "id": "result-2",
        "owner_user_id": "user-1",
        "image": "/uploads/user-1/favorite.jpg",
        "imageKey": "user-1/favorite.jpg",
        "expiresAt": 10,
    }
    store.insert("results", result)
    store.insert("favorites", result)

    stats = cleanup_expired_images(store, storage, now=20)

    assert stats["retained"] == 1
    assert (tmp_path / "uploads" / "user-1" / "favorite.jpg").exists()
