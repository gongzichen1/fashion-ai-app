"""用户图片存储适配器。生产可使用腾讯云 COS，开发默认使用本地目录。"""

import mimetypes
import os
import shutil


class LocalObjectStorage:
    backend = "local"

    def __init__(self, root, public_prefix="/uploads"):
        self.root = os.path.abspath(root)
        self.public_prefix = public_prefix.rstrip("/")
        os.makedirs(self.root, exist_ok=True)

    def _path(self, key):
        path = os.path.abspath(os.path.join(self.root, key))
        if os.path.commonpath([path, self.root]) != self.root:
            raise ValueError("非法对象 key")
        return path

    def upload(self, local_path, key):
        target = self._path(key)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        if os.path.abspath(local_path) != target:
            shutil.copy2(local_path, target)

    def url_for(self, key):
        return f"{self.public_prefix}/{key}"

    def read(self, key):
        path = self._path(key)
        with open(path, "rb") as file:
            return (
                file.read(),
                mimetypes.guess_type(path)[0] or "application/octet-stream",
            )

    def delete(self, key):
        if not key:
            return False
        try:
            os.remove(self._path(key))
            return True
        except FileNotFoundError:
            return False

    def health(self):
        return {"status": "ok", "backend": self.backend, "persistent": False}


class CosObjectStorage:
    backend = "cos"

    def __init__(
        self,
        secret_id,
        secret_key,
        region,
        bucket,
        token="",
        public_prefix="/uploads",
        client=None,
    ):
        if client is None and not all((secret_id, secret_key, region, bucket)):
            raise RuntimeError(
                "COS 存储缺少 COS_SECRET_ID/COS_SECRET_KEY/COS_REGION/COS_BUCKET"
            )
        self.bucket = bucket
        self.public_prefix = public_prefix.rstrip("/")
        if client is not None:
            self.client = client
        else:
            from qcloud_cos import CosConfig, CosS3Client

            config = CosConfig(
                Region=region,
                SecretId=secret_id,
                SecretKey=secret_key,
                Token=token or None,
                Scheme="https",
            )
            self.client = CosS3Client(config)

    def upload(self, local_path, key):
        self.client.upload_file(Bucket=self.bucket, LocalFilePath=local_path, Key=key)

    def url_for(self, key):
        # 图片始终通过带用户会话的同源代理读取，不暴露 COS 公网地址。
        return f"{self.public_prefix}/{key}"

    def read(self, key):
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        body = response["Body"].get_raw_stream().read()
        content_type = response.get("Content-Type") or mimetypes.guess_type(key)[0]
        return body, content_type or "application/octet-stream"

    def delete(self, key):
        if not key:
            return False
        self.client.delete_object(Bucket=self.bucket, Key=key)
        return True

    def health(self):
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except Exception:
            return {"status": "error", "backend": self.backend, "persistent": True}
        return {"status": "ok", "backend": self.backend, "persistent": True}


def create_object_storage(config):
    backend = config.get("STORAGE_BACKEND", "local").lower()
    if backend == "local":
        return LocalObjectStorage(
            config["UPLOAD_FOLDER"], config.get("STORAGE_PUBLIC_PREFIX", "/uploads")
        )
    if backend == "cos":
        return CosObjectStorage(
            config.get("COS_SECRET_ID"),
            config.get("COS_SECRET_KEY"),
            config.get("COS_REGION"),
            config.get("COS_BUCKET"),
            config.get("COS_TOKEN", ""),
            config.get("STORAGE_PUBLIC_PREFIX", "/uploads"),
        )
    raise RuntimeError(f"不支持的对象存储适配器: {backend}")
