# app.py - Flask主应用

import json
import os
import secrets

import click
from dotenv import load_dotenv
from flask import Flask, Response, abort, send_from_directory, session
from flask_cors import CORS

# 加载环境变量
load_dotenv()

from api import api_bp

# 导入配置和路由
from config import Config, config
from models.data_store import db
from services.catalog_service import import_catalog_directory
from services.lifecycle_service import cleanup_expired_images
from services.object_storage import create_object_storage
from services.runtime_readiness import verify_database_write, verify_storage_write


def production_config_errors(settings, database_backend):
    """返回会让生产部署退化为本地演示形态的配置问题。"""
    errors = []
    secret = settings.get("SECRET_KEY", "")
    if len(secret) < 32 or secret.startswith("replace-"):
        errors.append("SECRET_KEY 必须是至少 32 字符的随机值")
    if database_backend == "sqlite":
        errors.append("生产环境禁止使用 SQLite，请配置托管 MySQL/PostgreSQL")
    if settings.get("STORAGE_BACKEND", "local").lower() != "cos":
        errors.append("生产环境必须使用私有 COS")
    for name in (
        "COS_SECRET_ID",
        "COS_SECRET_KEY",
        "COS_REGION",
        "COS_BUCKET",
        "FEISHU_APP_ID",
        "FEISHU_APP_SECRET",
        "FEISHU_WEB_ORIGINS",
        "AI_API_URL",
        "AI_API_KEY",
        "AI_MODEL",
    ):
        if not settings.get(name):
            errors.append(f"缺少生产配置 {name}")
    if settings.get("FEISHU_DEV_LOGIN_ENABLED"):
        errors.append("生产环境禁止开启 FEISHU_DEV_LOGIN_ENABLED")
    if settings.get("AI_DEMO_MODE"):
        errors.append("生产环境禁止开启 AI_DEMO_MODE")
    origins = settings.get("CORS_ORIGINS", "")
    if not origins or "*" in {item.strip() for item in origins.split(",")}:
        errors.append("生产环境 CORS_ORIGINS 必须是明确白名单")
    return errors


def create_app(config_name="default"):
    """
    创建Flask应用实例

    Args:
        config_name: 配置名称（development/production/testing）

    Returns:
        Flask应用实例
    """
    config_name = config_name if config_name in config else "default"
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config[config_name])
    if not app.config.get("SECRET_KEY"):
        if config_name == "production":
            raise RuntimeError("生产环境必须配置 SECRET_KEY")
        app.config["SECRET_KEY"] = secrets.token_hex(32)
    if config_name == "production":
        errors = production_config_errors(app.config, db.backend)
        if errors:
            raise RuntimeError("生产配置校验失败: " + "; ".join(errors))

    # 启用CORS
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config.get("CORS_ORIGINS", "*"),
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        },
    )

    # 确保上传目录存在
    if not os.path.exists(app.config["UPLOAD_FOLDER"]):
        os.makedirs(app.config["UPLOAD_FOLDER"])

    # 注册蓝图
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.cli.command("cleanup-expired-images")
    def cleanup_expired_images_command():
        """清理超过保留期且未被收藏/衣橱引用的用户原图。"""
        stats = cleanup_expired_images(db, create_object_storage(app.config))
        click.echo(
            "scanned={scanned} deleted={deleted} retained={retained} failed={failed}".format(
                **stats
            )
        )

    @app.cli.command("production-preflight")
    @click.option(
        "--write-probes",
        is_flag=True,
        help="在回滚事务和 healthchecks/ 前缀验证数据库/COS 写读删",
    )
    def production_preflight_command(write_probes):
        """发布前检查数据库结构、存储连通性和可选写入权限。"""
        database = db.health()
        storage = create_object_storage(app.config)
        storage_health = storage.health()
        if database.get("status") != "ok" or database.get("schema") != "ok":
            raise click.ClickException("数据库连接或表结构未就绪")
        if storage_health.get("status") != "ok":
            raise click.ClickException("对象存储未就绪")
        database_write = storage_write = "skipped"
        if write_probes:
            database_write = "ok" if verify_database_write(db) else "error"
            storage_write = "ok" if verify_storage_write(storage) else "error"
            if "error" in {database_write, storage_write}:
                raise click.ClickException("数据库或对象存储写入探针失败")
        click.echo(
            "production_preflight_ok "
            f"database={database.get('backend')} schema=ok "
            f"storage={storage_health.get('backend')} "
            f"database_write={database_write} storage_write={storage_write}"
        )

    @app.cli.command("catalog-import")
    @click.argument("source_dir", type=click.Path(exists=True, file_okay=False))
    @click.option(
        "--review-status",
        type=click.Choice(["pending_rights_review", "approved"]),
        default="pending_rights_review",
        show_default=True,
    )
    @click.option("--source", default="legacy_uploads", show_default=True)
    @click.option(
        "--manifest",
        type=click.Path(exists=True, dir_okay=False),
        help="人工补充授权和服装标签后的 inventory JSON",
    )
    @click.option("--confirm-approved-rights", is_flag=True)
    def catalog_import_command(
        source_dir, review_status, source, manifest, confirm_approved_rights
    ):
        """去重导入公共服装目录；默认保持待授权审核、在线不可见。"""
        metadata_by_hash = {}
        if manifest:
            with open(manifest, encoding="utf-8") as source_file:
                payload = json.load(source_file)
            metadata_by_hash = {
                item["content_hash"]: item for item in payload.get("items", [])
            }
        result = import_catalog_directory(
            db,
            create_object_storage(app.config),
            source_dir,
            review_status=review_status,
            source=source,
            rights_confirmed=confirm_approved_rights,
            metadata_by_hash=metadata_by_hash,
        )
        click.echo(
            "created={created} existing={existing} rejected={rejected} failed={failed}".format(
                **result
            )
        )

    # 静态文件路由 - 用于访问上传的图片
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        user_id = session.get("user_id")
        normalized = os.path.normpath(filename).replace("\\", "/")
        if (
            not user_id
            or normalized.startswith("../")
            or not normalized.startswith(f"{user_id}/")
        ):
            abort(404)
        try:
            body, content_type = create_object_storage(app.config).read(normalized)
        except (FileNotFoundError, KeyError):
            abort(404)
        return Response(body, mimetype=content_type)

    # 静态文件路由 - 用于访问静态资源
    @app.route("/static/<path:filename>")
    def static_files(filename):
        static_folder = os.path.join(os.path.dirname(__file__), "static")
        return send_from_directory(static_folder, filename)

    # 根路由
    @app.route("/")
    def index():
        web_index = os.path.join(app.config["WEB_DIST_DIR"], "index.html")
        if os.path.isfile(web_index):
            return send_from_directory(app.config["WEB_DIST_DIR"], "index.html")
        return {
            "name": "智搭API服务",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "health": "/api/health",
                "analyze": "/api/analyze (POST)",
                "recommend": "/api/recommend (POST)",
                "weather": "/api/weather (GET)",
                "result": "/api/result/<id> (GET)",
                "history": "/api/history (GET)",
            },
        }

    @app.route("/<path:filename>")
    def web_app(filename):
        web_dist = app.config["WEB_DIST_DIR"]
        requested = os.path.join(web_dist, filename)
        if os.path.isfile(requested):
            return send_from_directory(web_dist, filename)
        web_index = os.path.join(web_dist, "index.html")
        if os.path.isfile(web_index):
            return send_from_directory(web_dist, "index.html")
        abort(404)

    # 错误处理
    @app.errorhandler(404)
    def not_found(error):
        return {"success": False, "message": "接口不存在"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {"success": False, "message": "服务器内部错误"}, 500

    return app


# 创建应用实例
app = create_app(os.getenv("FLASK_ENV", "development"))


if __name__ == "__main__":
    print(f"""
    ╔════════════════════════════════════════════╗
    ║         智搭 - 后端服务已启动              ║
    ╠════════════════════════════════════════════╣
    ║  API地址: http://{Config.HOST}:{Config.PORT}           ║
    ║  文档: 访问根路径查看可用接口              ║
    ╚════════════════════════════════════════════╝
    """)

    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
