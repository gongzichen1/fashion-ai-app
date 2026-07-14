"""飞书身份交换。"""

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
