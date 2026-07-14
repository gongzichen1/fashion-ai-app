#!/usr/bin/env python3
"""验证同源飞书 H5 + API 的生产部署，不输出任何凭据。"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request


def request(base_url, path, method="GET"):
    target = f"{base_url.rstrip('/')}{path}"
    req = urllib.request.Request(target, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status, response.headers, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers, exc.read()


def decode_json(payload, label):
    try:
        return json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"{label} 未返回合法 JSON") from exc


def verify_once(base_url):
    status, headers, body = request(base_url, "/")
    if status != 200 or b'<div id="root"></div>' not in body:
        raise RuntimeError("根路径未返回飞书 H5 构建产物")

    status, _, body = request(base_url, "/api/health")
    health = decode_json(body, "health")
    if status != 200 or not health.get("success"):
        raise RuntimeError("health 接口不可用")
    if not health.get("ready"):
        components = health.get("components") or {}
        states = ", ".join(
            f"{name}={value.get('status')}" for name, value in components.items()
        )
        raise RuntimeError(f"生产依赖未就绪: {states}")

    status, _, _ = request(base_url, "/api/me")
    if status != 401:
        raise RuntimeError("未登录访问 /api/me 没有返回 401")

    status, _, _ = request(base_url, "/api/history")
    if status != 401:
        raise RuntimeError("未登录访问 /api/history 没有返回 401")

    status, _, body = request(base_url, "/api/auth/dev-login", method="POST")
    if status != 404:
        raise RuntimeError("生产环境仍开放开发登录")
    error = decode_json(body, "dev-login")
    if (error.get("error") or {}).get("code") != "DEV_LOGIN_DISABLED":
        raise RuntimeError("开发登录关闭响应不符合契约")

    return health


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("base_url")
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--interval", type=int, default=5)
    args = parser.parse_args()

    last_error = None
    for attempt in range(1, max(args.attempts, 1) + 1):
        try:
            health = verify_once(args.base_url)
            print(
                "deployment_verified",
                f"version={health.get('version', 'unknown')}",
                f"attempt={attempt}",
            )
            return 0
        except Exception as exc:  # noqa: BLE001 - CLI needs bounded retries
            last_error = exc
            print(f"attempt={attempt} failed={exc}", file=sys.stderr)
            if attempt < args.attempts:
                time.sleep(max(args.interval, 0))
    print(f"deployment verification failed: {last_error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
