"""飞书身份交换与网页应用 JSSDK 鉴权。"""

import threading
import time

import requests


class FeishuAuthError(RuntimeError):
    pass


class FeishuAuthService:
    def __init__(self, app_id, app_secret, api_base, timeout=10):
        self.app_id = app_id
        self.app_secret = app_secret
        self.api_base = api_base.rstrip("/")
        self.timeout = timeout

    @property
    def configured(self):
        return bool(self.app_id and self.app_secret)

    def exchange_code(self, code):
        if not self.configured:
            raise FeishuAuthError("飞书应用凭据未配置")
        response = requests.post(
            f"{self.api_base}/authen/v2/oauth/token",
            json={
                "grant_type": "authorization_code",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "code": code,
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        body = response.json()
        access_token = body.get("access_token")
        if not access_token:
            raise FeishuAuthError(body.get("msg") or "飞书授权码无效")

        user_response = requests.get(
            f"{self.api_base}/authen/v1/user_info",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=self.timeout,
        )
        user_response.raise_for_status()
        user_body = user_response.json()
        data = user_body.get("data") or {}
        user_id = data.get("open_id") or data.get("user_id")
        if user_body.get("code") not in (None, 0) or not user_id:
            raise FeishuAuthError(user_body.get("msg") or "获取飞书用户信息失败")
        return {
            "external_id": f"feishu:{user_id}",
            "provider": "feishu",
            "open_id": data.get("open_id"),
            "union_id": data.get("union_id"),
            "name": data.get("name") or "飞书用户",
            "avatar_url": data.get("avatar_url") or "",
        }


class FeishuJsapiService:
    """获取并缓存 tenant token 与 jsapi_ticket。"""

    _cache = {}
    _lock = threading.RLock()

    def __init__(self, app_id, app_secret, api_base, timeout=10, now=None):
        self.app_id = app_id
        self.app_secret = app_secret
        self.api_base = api_base.rstrip("/")
        self.timeout = timeout
        self._now = now or time.time
        self._cache_key = (self.api_base, self.app_id)

    @property
    def configured(self):
        return bool(self.app_id and self.app_secret)

    @classmethod
    def clear_cache(cls):
        with cls._lock:
            cls._cache.clear()

    def _entry(self):
        return self._cache.setdefault(self._cache_key, {})

    def _tenant_access_token(self, force=False):
        if not self.configured:
            raise FeishuAuthError("飞书应用凭据未配置")
        with self._lock:
            entry = self._entry()
            now = self._now()
            if not force and entry.get("tenant_expires_at", 0) > now:
                return entry["tenant_access_token"]
            response = requests.post(
                f"{self.api_base}/auth/v3/tenant_access_token/internal",
                json={"app_id": self.app_id, "app_secret": self.app_secret},
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()
            token = body.get("tenant_access_token")
            if body.get("code") not in (None, 0) or not token:
                raise FeishuAuthError(body.get("msg") or "获取飞书应用凭证失败")
            expires_in = max(int(body.get("expire") or 7200), 60)
            entry["tenant_access_token"] = token
            entry["tenant_expires_at"] = now + max(expires_in - 300, 30)
            return token

    def ticket(self):
        if not self.configured:
            raise FeishuAuthError("飞书应用凭据未配置")
        with self._lock:
            entry = self._entry()
            now = self._now()
            if entry.get("ticket_expires_at", 0) > now:
                return entry["ticket"]
            token = self._tenant_access_token()
            response = requests.post(
                f"{self.api_base}/jssdk/ticket/get",
                json={},
                headers={"Authorization": f"Bearer {token}"},
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()
            data = body.get("data") or {}
            ticket = data.get("ticket")
            if body.get("code") not in (None, 0) or not ticket:
                raise FeishuAuthError(body.get("msg") or "获取飞书 JSSDK 凭证失败")
            expires_in = max(int(data.get("expire_in") or 7200), 60)
            entry["ticket"] = ticket
            entry["ticket_expires_at"] = now + max(expires_in - 300, 30)
            return ticket


class WechatAuthError(RuntimeError):
    pass


class WechatAuthService:
    def __init__(self, app_id, app_secret, api_base, timeout=10):
        self.app_id = app_id
        self.app_secret = app_secret
        self.api_base = api_base.rstrip("/")
        self.timeout = timeout

    @property
    def configured(self):
        return bool(self.app_id and self.app_secret)

    def exchange_code(self, code):
        if not self.configured:
            raise WechatAuthError("微信小程序凭据未配置")
        response = requests.get(
            f"{self.api_base}/sns/jscode2session",
            params={
                "appid": self.app_id,
                "secret": self.app_secret,
                "js_code": code,
                "grant_type": "authorization_code",
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        body = response.json()
        open_id = body.get("openid")
        if body.get("errcode") or not open_id:
            raise WechatAuthError(body.get("errmsg") or "微信授权码无效")
        return {
            "external_id": f"wechat:{open_id}",
            "provider": "wechat",
            "open_id": open_id,
            "union_id": body.get("unionid"),
            "name": "微信用户",
            "avatar_url": "",
        }
