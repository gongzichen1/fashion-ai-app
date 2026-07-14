#!/usr/bin/env python3
"""使用两个真实登录会话验证飞书生产环境的数据和图片隔离。"""

import argparse
import json
import mimetypes
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests


class AcceptanceError(RuntimeError):
    pass


class ApiClient:
    def __init__(self, base_url, session_file, label):
        parsed = urlparse(base_url)
        if (
            parsed.scheme != "https"
            or not parsed.netloc
            or parsed.query
            or parsed.fragment
        ):
            raise AcceptanceError("生产验收地址必须是明确的 HTTPS URL")
        self.base_url = base_url.rstrip("/") + "/"
        self.label = label
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})
        self._load_session(Path(session_file))

    def _load_session(self, path):
        content = path.read_text(encoding="utf-8").strip()
        if not content:
            raise AcceptanceError(f"{self.label} 会话文件为空")
        if content.startswith("{"):
            payload = json.loads(content)
            cookies = payload.get("cookies", [])
            if not cookies:
                raise AcceptanceError(f"{self.label} storage state 没有 cookies")
            for cookie in cookies:
                self.session.cookies.set(
                    cookie["name"],
                    cookie["value"],
                    domain=cookie.get("domain"),
                    path=cookie.get("path", "/"),
                )
            return
        cookie_header = content.removeprefix("Cookie:").strip()
        if "=" not in cookie_header or "\n" in cookie_header or "\r" in cookie_header:
            raise AcceptanceError(f"{self.label} 会话文件不是 Cookie header")
        self.session.headers["Cookie"] = cookie_header

    def request(self, method, path, expected, **kwargs):
        url = urljoin(self.base_url, path.lstrip("/"))
        response = self.session.request(
            method, url, timeout=90, allow_redirects=False, **kwargs
        )
        expected = {expected} if isinstance(expected, int) else set(expected)
        if response.status_code not in expected:
            raise AcceptanceError(
                f"{self.label} {method} {path} 返回 {response.status_code}，预期 {sorted(expected)}"
            )
        try:
            payload = response.json()
        except requests.exceptions.JSONDecodeError as exc:
            raise AcceptanceError(f"{self.label} {method} {path} 未返回 JSON") from exc
        return response.status_code, payload

    def image_status(self, path):
        parsed = urlparse(path)
        if parsed.netloc and parsed.netloc != urlparse(self.base_url).netloc:
            raise AcceptanceError("图片 URL 不是同源地址，拒绝携带会话访问")
        url = path if parsed.netloc else urljoin(self.base_url, path.lstrip("/"))
        return self.session.get(url, timeout=30, allow_redirects=False).status_code

    def analyze(self, image_path):
        content_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
        with image_path.open("rb") as source:
            _, payload = self.request(
                "POST",
                "/api/analyze",
                200,
                files={"image": (image_path.name, source, content_type)},
            )
        data = payload.get("data") or {}
        if not data.get("id") or not data.get("image") or not data.get("imageKey"):
            raise AcceptanceError(f"{self.label} 分析结果缺少 id/image/imageKey")
        return data


def require(value, message):
    if not value:
        raise AcceptanceError(message)


def data(payload):
    return payload.get("data")


def ids(payload):
    return {item.get("id") for item in (data(payload) or [])}


def verify_production_dependencies(client):
    _, payload = client.request("GET", "/api/health", 200)
    components = payload.get("components") or {}
    require(payload.get("status") == "ready", "生产 health 不是 ready")
    require(
        (components.get("database") or {}).get("backend") in {"mysql", "postgresql"},
        "数据库不是 MySQL/PostgreSQL",
    )
    storage = components.get("storage") or {}
    require(
        storage.get("status") == "ok"
        and storage.get("backend") == "cos"
        and storage.get("persistent") is True,
        "私有 COS 未通过在线可访问性检查",
    )
    require((components.get("ai") or {}).get("status") == "ok", "真实 AI 未就绪")
    require((components.get("feishu") or {}).get("status") == "ok", "飞书免登未配置")


def verify_cross_access(owner, other, result):
    result_id = result["id"]
    image = result["image"]
    owner.request("GET", f"/api/result/{result_id}", 200)
    other.request("GET", f"/api/result/{result_id}", 404)
    other.request("POST", "/api/favorites", 404, json={"analysis_id": result_id})
    other.request("POST", "/api/wardrobe", 404, json={"analysis_id": result_id})
    _, deleted = other.request("DELETE", f"/api/result/{result_id}", 200)
    require(deleted.get("deleted") is False, "非所有者竟然删除了分析结果")
    require(owner.image_status(image) == 200, "所有者无法读取自己的私有图片")
    require(other.image_status(image) == 404, "另一账号可以读取私有图片")


def add_idempotent_resource(client, resource, result_id):
    _, first = client.request(
        "POST", f"/api/{resource}", {200, 201}, json={"analysis_id": result_id}
    )
    _, second = client.request(
        "POST", f"/api/{resource}", 200, json={"analysis_id": result_id}
    )
    require(first.get("created") is True, f"首次添加 {resource} 未创建资源")
    require(second.get("created") is False, f"重复添加 {resource} 不是幂等操作")
    _, listing = client.request("GET", f"/api/{resource}?page=1&per_page=100", 200)
    require(result_id in ids(listing), f"{resource} 列表缺少新资源")


def verify_reference_lifecycle(client, other, result):
    result_id = result["id"]
    image = result["image"]
    add_idempotent_resource(client, "favorites", result_id)
    add_idempotent_resource(client, "wardrobe", result_id)
    for resource in ("favorites", "wardrobe"):
        _, other_listing = other.request(
            "GET", f"/api/{resource}?page=1&per_page=100", 200
        )
        require(result_id not in ids(other_listing), f"另一账号看到了 {resource} 资源")

    _, deleted = client.request("DELETE", f"/api/result/{result_id}", 200)
    require(deleted.get("deleted") is True, "所有者无法删除分析记录")
    require(deleted.get("imageRetained") is True, "仍有引用时图片没有被保留")
    require(client.image_status(image) == 200, "有衣橱/收藏引用时图片已丢失")

    _, favorite = client.request("DELETE", f"/api/favorites/{result_id}", 200)
    require(favorite.get("imageDeleted") is False, "仍有衣橱引用时图片被删除")
    require(client.image_status(image) == 200, "仍有衣橱引用时图片不可读")

    _, wardrobe = client.request("DELETE", f"/api/wardrobe/{result_id}", 200)
    require(wardrobe.get("imageDeleted") is True, "最后一个引用移除后图片未删除")
    require(client.image_status(image) == 404, "已删除原图仍然可以读取")


def cleanup(client, result):
    if not result:
        return
    result_id = result.get("id")
    for path in (
        f"/api/favorites/{result_id}",
        f"/api/wardrobe/{result_id}",
        f"/api/result/{result_id}",
    ):
        try:
            client.request("DELETE", path, 200)
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument(
        "--account-a", required=True, help="账号 A Cookie/storage state 文件"
    )
    parser.add_argument(
        "--account-b", required=True, help="账号 B Cookie/storage state 文件"
    )
    parser.add_argument("--client", required=True, choices=("mobile", "desktop"))
    parser.add_argument("--image", required=True, type=Path)
    parser.add_argument(
        "--confirm-production-test",
        action="store_true",
        help="确认会创建并清理两条真实 AI 分析记录",
    )
    args = parser.parse_args()
    if not args.confirm_production_test:
        parser.error("必须显式传入 --confirm-production-test")
    if not args.image.is_file():
        parser.error("测试图片不存在")

    account_a = account_b = None
    result_a = result_b = None
    try:
        account_a = ApiClient(args.base_url, args.account_a, "账号 A")
        account_b = ApiClient(args.base_url, args.account_b, "账号 B")
        verify_production_dependencies(account_a)
        _, me_a = account_a.request("GET", "/api/me", 200)
        _, me_b = account_b.request("GET", "/api/me", 200)
        user_a = (data(me_a) or {}).get("id")
        user_b = (data(me_b) or {}).get("id")
        require(user_a and user_b and user_a != user_b, "两个会话没有映射到不同用户")

        result_a = account_a.analyze(args.image)
        result_b = account_b.analyze(args.image)
        _, history_a = account_a.request("GET", "/api/history?page=1&per_page=100", 200)
        _, history_b = account_b.request("GET", "/api/history?page=1&per_page=100", 200)
        require(
            result_a["id"] in ids(history_a) and result_b["id"] not in ids(history_a),
            "账号 A 历史列表隔离失败",
        )
        require(
            result_b["id"] in ids(history_b) and result_a["id"] not in ids(history_b),
            "账号 B 历史列表隔离失败",
        )
        verify_cross_access(account_a, account_b, result_a)
        verify_cross_access(account_b, account_a, result_b)
        verify_reference_lifecycle(account_a, account_b, result_a)
        result_a = None

        _, deleted_b = account_b.request("DELETE", f"/api/result/{result_b['id']}", 200)
        require(deleted_b.get("deleted") is True, "账号 B 无法删除自己的结果")
        require(
            account_b.image_status(result_b["image"]) == 404,
            "账号 B 删除结果后原图仍可读取",
        )
        result_b = None
        print(f"two_account_isolation_verified client={args.client}")
        return 0
    except (
        AcceptanceError,
        OSError,
        requests.RequestException,
        json.JSONDecodeError,
    ) as exc:
        print(f"two account acceptance failed: {exc}", file=sys.stderr)
        return 1
    finally:
        if account_a:
            cleanup(account_a, result_a)
        if account_b:
            cleanup(account_b, result_b)


if __name__ == "__main__":
    raise SystemExit(main())
