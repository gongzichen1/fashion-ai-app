import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from models.data_store import DataStore
from services.object_storage import LocalObjectStorage
from services.runtime_readiness import verify_database_write, verify_storage_write


def test_runtime_write_probes_leave_no_database_or_object_residue(tmp_path):
    store = DataStore(str(tmp_path / "database"))
    storage_root = tmp_path / "objects"
    storage = LocalObjectStorage(str(storage_root))

    assert verify_database_write(store) is True
    assert store.scan("feedback") == []
    assert verify_storage_write(storage) is True
    assert list(storage_root.rglob("*.txt")) == []


def test_runtime_storage_probe_sanitizes_provider_failure():
    class FailingStorage:
        def upload(self, path, key):
            raise RuntimeError("provider secret detail")

        def delete(self, key):
            return False

    assert verify_storage_write(FailingStorage()) is False
