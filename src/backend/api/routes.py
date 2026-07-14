"""统一 API：飞书 H5 与微信小程序共用。"""

import hashlib
import json
import os
import time
import uuid
from datetime import datetime
from functools import wraps

import requests
from flask import Blueprint, current_app, jsonify, request, session
from models.data_store import db
from services import AIService, ImageService
from services.ai_service import AIServiceError
from services.auth_service import (
    FeishuAuthError,
    FeishuAuthService,
    WechatAuthError,
    WechatAuthService,
)
from services.object_storage import create_object_storage

api_bp = Blueprint("api", __name__)
ai_service = AIService()


def _error(message, status=400, code=None, request_id=None):
    body = {"success": False, "message": message}
    if code:
        body["error"] = {"code": code}
    if request_id:
        body["requestId"] = request_id
    return jsonify(body), status


def _current_user_id():
    return session.get("user_id")


def login_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        if not _current_user_id():
            return _error("请先登录", 401, "AUTH_REQUIRED")
        return handler(*args, **kwargs)

    return wrapped


def _auth_service():
    return FeishuAuthService(
        current_app.config.get("FEISHU_APP_ID"),
        current_app.config.get("FEISHU_APP_SECRET"),
        current_app.config.get("FEISHU_API_BASE"),
    )


def _wechat_auth_service():
    return WechatAuthService(
        current_app.config.get("WECHAT_APP_ID"),
        current_app.config.get("WECHAT_APP_SECRET"),
        current_app.config.get("WECHAT_API_BASE"),
    )


def _upsert_user(identity):
    user = db.find_one("users", {"external_id": identity["external_id"]})
    if user:
        db.update_one("users", {"id": user["id"]}, identity)
        return db.find_one("users", {"id": user["id"]})
    user = dict(identity)
    user_id = db.insert("users", user)
    return db.find_one("users", {"id": user_id})


@api_bp.post("/auth/feishu/login")
def feishu_login():
    code = (request.get_json(silent=True) or {}).get("code", "").strip()
    if not code:
        return _error("缺少飞书授权码", 400, "AUTH_CODE_REQUIRED")
    try:
        user = _upsert_user(_auth_service().exchange_code(code))
    except (FeishuAuthError, requests.RequestException) as exc:
        current_app.logger.warning("飞书登录失败: %s", exc)
        return _error("飞书登录失败", 401, "FEISHU_LOGIN_FAILED")
    session.clear()
    session["user_id"] = user["id"]
    session.permanent = True
    return jsonify({"success": True, "data": _public_user(user)})


@api_bp.post("/auth/dev-login")
def dev_login():
    if not current_app.config.get("FEISHU_DEV_LOGIN_ENABLED"):
        return _error("开发登录未启用", 404, "DEV_LOGIN_DISABLED")
    data = request.get_json(silent=True) or {}
    dev_id = str(data.get("userId") or data.get("user_id") or "local-developer")[:128]
    user = _upsert_user(
        {
            "external_id": f"dev:{dev_id}",
            "provider": "development",
            "name": data.get("name") or "开发用户",
            "avatar_url": "",
        }
    )
    session.clear()
    session["user_id"] = user["id"]
    session.permanent = True
    return jsonify({"success": True, "data": _public_user(user), "development": True})


@api_bp.post("/auth/wechat/login")
def wechat_login():
    code = (request.get_json(silent=True) or {}).get("code", "").strip()
    if not code:
        return _error("缺少微信授权码", 400, "AUTH_CODE_REQUIRED")
    try:
        user = _upsert_user(_wechat_auth_service().exchange_code(code))
    except (WechatAuthError, requests.RequestException) as exc:
        current_app.logger.warning("微信登录失败: %s", exc)
        return _error("微信登录失败", 401, "WECHAT_LOGIN_FAILED")
    session.clear()
    session["user_id"] = user["id"]
    session.permanent = True
    return jsonify({"success": True, "data": _public_user(user)})


@api_bp.get("/me")
@login_required
def me():
    user = db.find_one("users", {"id": _current_user_id()})
    if not user:
        session.clear()
        return _error("会话已失效", 401, "SESSION_INVALID")
    return jsonify({"success": True, "data": _public_user(user)})


@api_bp.post("/auth/logout")
def logout():
    session.clear()
    return jsonify({"success": True})


@api_bp.get("/auth/feishu/jsapi-config")
@login_required
def jsapi_config():
    url = request.args.get("url", "")
    ticket = current_app.config.get("FEISHU_JSAPI_TICKET", "")
    if not url or not ticket:
        return jsonify({"success": True, "data": {"enabled": False}})
    nonce, timestamp = uuid.uuid4().hex, int(time.time())
    raw = f"jsapi_ticket={ticket}&noncestr={nonce}&timestamp={timestamp}&url={url}"
    signature = hashlib.sha1(raw.encode()).hexdigest()
    return jsonify(
        {
            "success": True,
            "data": {
                "enabled": True,
                "appId": current_app.config["FEISHU_APP_ID"],
                "nonceStr": nonce,
                "timestamp": timestamp,
                "signature": signature,
            },
        }
    )


@api_bp.get("/health")
def health_check():
    components = {
        "database": {"status": "ok" if db.ping() else "error", "backend": "sqlite"},
        "storage": create_object_storage(current_app.config).health(),
        "ai": {
            "status": (
                "ok"
                if ai_service._configured()
                else (
                    "demo" if current_app.config.get("AI_DEMO_MODE") else "unconfigured"
                )
            )
        },
        "feishu": {"status": "ok" if _auth_service().configured else "unconfigured"},
        "wechat": {
            "status": "ok" if _wechat_auth_service().configured else "unconfigured"
        },
    }
    ready = all(item["status"] in {"ok", "demo"} for item in components.values())
    return jsonify(
        {
            "success": True,
            "status": "ready" if ready else "degraded",
            "components": components,
            "timestamp": datetime.now().isoformat(),
        }
    )


@api_bp.post("/analyze")
@login_required
def analyze_image():
    request_id = uuid.uuid4().hex
    filename = None
    try:
        style_preference = _style_preference()
        if "image" in request.files:
            file = request.files["image"]
            ext = _get_upload_extension(file)
            if not ext:
                return _error("不支持的图片格式", 400, "INVALID_IMAGE", request_id)
            filename = (
                f"{_current_user_id()}/{uuid.uuid4().hex}_{int(time.time())}.{ext}"
            )
            os.makedirs(
                os.path.dirname(
                    os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
                ),
                exist_ok=True,
            )
            filepath = ImageService.save_image(file, filename)
            ImageService.resize_image(filepath)
            image_base64 = ImageService.image_to_base64(filepath)
        elif request.is_json and (request.get_json(silent=True) or {}).get(
            "image_base64"
        ):
            image_base64 = request.get_json()["image_base64"]
            filename = f"{_current_user_id()}/{uuid.uuid4().hex}_{int(time.time())}.jpg"
            os.makedirs(
                os.path.dirname(
                    os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
                ),
                exist_ok=True,
            )
            filepath = ImageService.save_image(image_base64, filename)
        else:
            return _error("请上传图片", 400, "IMAGE_REQUIRED", request_id)

        analysis = ai_service.analyze_image(image_base64, style_preference)
        recommendation = ai_service.generate_recommendations(analysis, style_preference)
        try:
            primary_color = ImageService.rgb_to_hex(
                ImageService.extract_colors(filepath)[0]
            )
        except (IndexError, TypeError, ValueError):
            primary_color = analysis.get("primary_color", "")
        storage = create_object_storage(current_app.config)
        storage.upload(filepath, filename)
        result = {
            "id": uuid.uuid4().hex,
            "owner_user_id": _current_user_id(),
            "image": storage.url_for(filename),
            "imageKey": filename,
            "expiresAt": int(time.time())
            + current_app.config["IMAGE_RETENTION_DAYS"] * 86400,
            "garmentType": analysis.get("garment_type", "未知"),
            "category": analysis.get("category", "未知"),
            "primaryColor": primary_color,
            "colorName": analysis.get("color_name", "未知"),
            "styles": analysis.get("styles", []),
            "pattern": analysis.get("pattern", "未知"),
            "material": analysis.get("material", "未知"),
            "length": analysis.get("length", "未知"),
            "scenes": analysis.get("suitable_scenes", []),
            "seasons": analysis.get("suitable_seasons", []),
            "description": analysis.get("description", ""),
            "overallStyle": recommendation.get("overall_style", ""),
            "styleTips": recommendation.get("style_tips", ""),
            "recommendations": _format_recommendations(
                recommendation.get("recommendations", [])
            ),
        }
        db.insert("results", result.copy())
        if storage.backend != "local":
            try:
                os.remove(filepath)
            except FileNotFoundError:
                pass
        return jsonify(
            {
                "success": True,
                "message": "分析成功",
                "requestId": request_id,
                "data": result,
            }
        )
    except AIServiceError as exc:
        if filename:
            create_object_storage(current_app.config).delete(filename)
        current_app.logger.warning("AI 分析失败 request_id=%s code=%s", request_id, exc)
        code = str(exc)
        return _error("AI 服务暂时不可用", 503, code, request_id)
    except Exception:
        if filename:
            try:
                create_object_storage(current_app.config).delete(filename)
            except Exception:
                current_app.logger.exception(
                    "清理失败上传 request_id=%s key=%s", request_id, filename
                )
        current_app.logger.exception("分析错误 request_id=%s", request_id)
        return _error("分析失败", 500, "ANALYSIS_FAILED", request_id)


@api_bp.get("/result/<result_id>")
@login_required
def get_result(result_id):
    result = db.find_one(
        "results", {"id": result_id, "owner_user_id": _current_user_id()}
    )
    return (
        jsonify({"success": True, "data": result})
        if result
        else _error("结果不存在", 404, "NOT_FOUND")
    )


@api_bp.delete("/result/<result_id>")
@login_required
def delete_result(result_id):
    result = db.find_one(
        "results", {"id": result_id, "owner_user_id": _current_user_id()}
    )
    if not result:
        return jsonify({"success": True, "deleted": False})
    db.delete_one("results", {"id": result_id, "owner_user_id": _current_user_id()})
    retained = any(
        db.find_one(collection, {"id": result_id, "owner_user_id": _current_user_id()})
        for collection in ("favorites", "wardrobe_items")
    )
    if not retained:
        create_object_storage(current_app.config).delete(result.get("imageKey"))
    return jsonify({"success": True, "deleted": True, "imageRetained": retained})


@api_bp.get("/history")
@login_required
def get_history():
    page, per_page = _pagination()
    data = db.find_many(
        "results",
        {"owner_user_id": _current_user_id()},
        per_page,
        (page - 1) * per_page,
    )
    return jsonify(
        {
            "success": True,
            "data": data,
            "pagination": {
                "page": page,
                "perPage": per_page,
                "hasMore": len(data) == per_page,
            },
        }
    )


def _resource_routes(name, collection):
    endpoint = name.replace("/", "_")

    @api_bp.get(name, endpoint=f"list_{endpoint}")
    @login_required
    def list_items():
        page, per_page = _pagination()
        items = db.find_many(
            collection,
            {"owner_user_id": _current_user_id()},
            per_page,
            (page - 1) * per_page,
        )
        return jsonify(
            {
                "success": True,
                "data": items,
                "pagination": {
                    "page": page,
                    "perPage": per_page,
                    "hasMore": len(items) == per_page,
                },
            }
        )

    @api_bp.post(name, endpoint=f"create_{endpoint}")
    @login_required
    def create_item():
        data = request.get_json(silent=True) or {}
        data.pop("owner_user_id", None)
        if collection in {"favorites", "wardrobe_items"}:
            analysis_id = data.get("analysis_id") or data.get("analysisId")
            analysis = db.find_one(
                "results", {"id": analysis_id, "owner_user_id": _current_user_id()}
            )
            if not analysis:
                return _error("分析结果不存在", 404, "ANALYSIS_NOT_FOUND")
            # 使用 analysis id 作为资源 id，保证重复添加幂等，也与前端删除契约一致。
            snapshot = {
                key: value
                for key, value in analysis.items()
                if key not in {"owner_user_id", "created_at", "updated_at"}
            }
            data = dict(snapshot, **data)
            data["id"] = analysis_id
            data["analysisId"] = analysis_id
        data["owner_user_id"] = _current_user_id()
        existing = None
        if data.get("id"):
            existing = db.find_one(
                collection, {"id": data["id"], "owner_user_id": _current_user_id()}
            )
        if existing:
            return jsonify({"success": True, "data": existing, "created": False})
        item_id = db.insert(collection, data)
        return (
            jsonify(
                {
                    "success": True,
                    "data": db.find_one(collection, {"id": item_id}),
                    "created": True,
                }
            ),
            201,
        )

    @api_bp.delete(f"{name}/<item_id>", endpoint=f"delete_{endpoint}")
    @login_required
    def delete_item(item_id):
        deleted = db.delete_one(
            collection, {"id": item_id, "owner_user_id": _current_user_id()}
        )
        return jsonify({"success": True, "deleted": deleted})


_resource_routes("/favorites", "favorites")
_resource_routes("/wardrobe", "wardrobe_items")


@api_bp.route("/profile", methods=["GET", "PUT"])
@api_bp.route("/preferences", methods=["GET", "PUT"])
@login_required
def preferences():
    query = {"owner_user_id": _current_user_id()}
    if request.method == "GET":
        return jsonify(
            {"success": True, "data": db.find_one("user_profiles", query) or {}}
        )
    data = request.get_json(silent=True) or {}
    profile = db.find_one("user_profiles", query)
    if profile:
        db.update_one("user_profiles", query, data)
        profile_id = profile["id"]
    else:
        profile_id = db.insert(
            "user_profiles", dict(data, owner_user_id=_current_user_id())
        )
    return jsonify(
        {"success": True, "data": db.find_one("user_profiles", {"id": profile_id})}
    )


@api_bp.post("/feedback")
@login_required
def feedback():
    data = request.get_json(silent=True) or {}
    if not str(data.get("content", "")).strip():
        return _error("请填写反馈内容", 400, "CONTENT_REQUIRED")
    item_id = db.insert("feedback", dict(data, owner_user_id=_current_user_id()))
    return jsonify({"success": True, "data": {"id": item_id}}), 201


@api_bp.post("/recommend")
@login_required
def get_recommendations():
    data = request.get_json(silent=True) or {}
    analysis = data.get("analysisResult")
    if not analysis:
        return _error("请提供服装分析结果")
    try:
        value = ai_service.generate_recommendations(analysis)
    except AIServiceError as exc:
        return _error("AI 服务暂时不可用", 503, str(exc))
    formatted = _format_recommendations(value.get("recommendations", []))
    scene = data.get("scene", "all")
    if scene != "all":
        formatted = [item for item in formatted if scene in item.get("scenes", [])]
    return jsonify(
        {
            "success": True,
            "data": {
                "overallStyle": value.get("overall_style", ""),
                "styleTips": value.get("style_tips", ""),
                "recommendations": formatted,
            },
        }
    )


@api_bp.get("/weather")
def get_weather():
    latitude = request.args.get("latitude", type=float)
    longitude = request.args.get("longitude", type=float)
    if (
        latitude is None
        or longitude is None
        or not (-90 <= latitude <= 90)
        or not (-180 <= longitude <= 180)
    ):
        return _error("请提供合法的 latitude 和 longitude")
    try:
        return jsonify(
            {"success": True, "data": _fetch_current_weather(latitude, longitude)}
        )
    except requests.RequestException:
        return _error("天气服务暂时不可用", 503, "WEATHER_UNAVAILABLE")


def _public_user(user):
    return {
        "id": user["id"],
        "name": user.get("name", ""),
        "avatarUrl": user.get("avatar_url", ""),
    }


def _pagination():
    return max(request.args.get("page", 1, type=int), 1), min(
        max(request.args.get("per_page", 20, type=int), 1), 100
    )


def _style_preference():
    raw = request.form.get("style_preference") if request.form else None
    if not raw:
        return None
    try:
        value = json.loads(raw) if isinstance(raw, str) else raw
        return {
            "preferred_styles": value.get("preferred_styles", value.get("styles", [])),
            "common_scenes": value.get("common_scenes", value.get("scenarios", [])),
            "budget": value.get("budget", ""),
        }
    except json.JSONDecodeError:
        return None


def _fetch_current_weather(latitude, longitude):
    response = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,weather_code,wind_speed_10m",
            "timezone": "auto",
        },
        timeout=8,
    )
    response.raise_for_status()
    current = response.json().get("current") or {}
    temperature = round(float(current.get("temperature_2m", 0)))
    code = int(current.get("weather_code", 0))
    wind = round(float(current.get("wind_speed_10m", 0)))
    return {
        "temperature": temperature,
        "condition": _weather_code_text(code),
        "weatherCode": code,
        "windSpeed": wind,
        "windText": "微风" if wind < 12 else ("有风" if wind < 29 else "风较大"),
        "outfitAdvice": _outfit_advice(temperature, code, wind),
        "latitude": latitude,
        "longitude": longitude,
        "updatedAt": current.get("time") or datetime.now().isoformat(),
    }


def _weather_code_text(code):
    return {
        0: "晴",
        1: "大部晴朗",
        2: "多云",
        3: "阴",
        45: "雾",
        48: "雾凇",
        51: "小毛毛雨",
        53: "毛毛雨",
        55: "大毛毛雨",
        61: "小雨",
        63: "中雨",
        65: "大雨",
        71: "小雪",
        73: "中雪",
        75: "大雪",
        80: "阵雨",
        81: "较强阵雨",
        82: "强阵雨",
        95: "雷雨",
    }.get(code, "天气")


def _outfit_advice(temperature, code, wind):
    if temperature <= 5:
        advice = "羽绒服或厚大衣，内搭保暖针织。"
    elif temperature <= 12:
        advice = "大衣或棉服，搭配长裤和围巾。"
    elif temperature <= 20:
        advice = "薄外套、针织衫或卫衣更合适。"
    elif temperature <= 27:
        advice = "衬衫、T恤或轻薄套装即可。"
    else:
        advice = "短袖、轻薄裙装或透气面料更舒适。"
    if code in {51, 53, 55, 61, 63, 65, 80, 81, 82, 95}:
        advice += " 记得带伞，鞋子选防滑款。"
    elif code in {71, 73, 75}:
        advice += " 注意防滑，外层选择防风保暖。"
    elif wind >= 29:
        advice += " 风大，建议加防风外套。"
    return advice


def _get_upload_extension(file):
    filename = file.filename or ""
    if ImageService.allowed_file(filename):
        return filename.rsplit(".", 1)[1].lower()
    mapping = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
    }
    if file.mimetype in mapping:
        return mapping[file.mimetype]
    position = file.stream.tell()
    header = file.stream.read(32)
    file.stream.seek(position)
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if header.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return "webp"
    return None


def _format_recommendations(items):
    return [
        {
            "id": item.get("id") or f"rec_{i}",
            "type": item.get("type", "未知"),
            "name": item.get("name", "推荐单品"),
            "description": item.get("description", ""),
            "color": item.get("color", ""),
            "reason": item.get("reason", ""),
            "scenes": item.get("scenes", []),
            "tags": item.get("tags", []),
        }
        for i, item in enumerate(items)
    ]
