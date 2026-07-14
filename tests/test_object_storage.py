import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

from services.object_storage import CosObjectStorage


class FakeCosBody:
    def __init__(self, value):
        self.value = value

    def get_raw_stream(self):
        return io.BytesIO(self.value)


class FakeCosClient:
    def __init__(self):
        self.uploaded = None
        self.deleted = None

    def upload_file(self, **kwargs):
        self.uploaded = kwargs

    def get_object(self, **kwargs):
        assert kwargs == {"Bucket": "private-bucket", "Key": "user/image.png"}
        return {"Body": FakeCosBody(b"private-image"), "Content-Type": "image/png"}

    def delete_object(self, **kwargs):
        self.deleted = kwargs


def test_cos_storage_uses_private_proxy_contract(tmp_path):
    client = FakeCosClient()
    source = tmp_path / "image.png"
    source.write_bytes(b"private-image")
    storage = CosObjectStorage(
        "",
        "",
        "",
        "private-bucket",
        client=client,
    )

    storage.upload(str(source), "user/image.png")
    body, content_type = storage.read("user/image.png")

    assert client.uploaded == {
        "Bucket": "private-bucket",
        "LocalFilePath": str(source),
        "Key": "user/image.png",
    }
    assert storage.url_for("user/image.png") == "/uploads/user/image.png"
    assert body == b"private-image"
    assert content_type == "image/png"
    assert storage.delete("user/image.png") is True
    assert client.deleted == {"Bucket": "private-bucket", "Key": "user/image.png"}
    assert storage.health() == {
        "status": "ok",
        "backend": "cos",
        "persistent": True,
    }
