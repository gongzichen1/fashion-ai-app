# config/settings.py - 配置文件

import os

from dotenv import load_dotenv

load_dotenv()


BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(BASE_DIR))


class Config:
    """基础配置"""

    SECRET_KEY = os.getenv("SECRET_KEY", "")

    # OpenAI-compatible LLM配置
    AI_API_URL = os.getenv("AI_API_URL", os.getenv("MINIMAX_API_URL", ""))
    AI_API_KEY = os.getenv("AI_API_KEY", os.getenv("MINIMAX_API_KEY", ""))
    AI_MODEL = os.getenv("AI_MODEL", os.getenv("MINIMAX_MODEL", ""))
    AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", os.getenv("MINIMAX_TIMEOUT", 60)))
    AI_DEMO_MODE = os.getenv("AI_DEMO_MODE", "False").lower() == "true"

    # 服务器配置
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5001))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"

    # 上传配置
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 最大16MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

    # 数据存储配置
    DATA_DIR = os.getenv("DATA_DIR", os.path.join(PROJECT_DIR, "data"))
    DATABASE_URL = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'fashion_ai.db')}"
    )
    STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")
    STORAGE_PUBLIC_PREFIX = os.getenv("STORAGE_PUBLIC_PREFIX", "/uploads")
    COS_SECRET_ID = os.getenv("COS_SECRET_ID", "")
    COS_SECRET_KEY = os.getenv("COS_SECRET_KEY", "")
    COS_REGION = os.getenv("COS_REGION", "")
    COS_BUCKET = os.getenv("COS_BUCKET", "")
    COS_TOKEN = os.getenv("COS_TOKEN", "")
    IMAGE_RETENTION_DAYS = int(os.getenv("IMAGE_RETENTION_DAYS", 30))
    WEB_DIST_DIR = os.getenv(
        "WEB_DIST_DIR", os.path.join(PROJECT_DIR, "src", "feishu-web", "dist")
    )
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # 飞书企业自建应用。生产必须配置凭据；开发登录需显式开启。
    FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "")
    FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "")
    FEISHU_API_BASE = os.getenv("FEISHU_API_BASE", "https://open.feishu.cn/open-apis")
    FEISHU_WEB_ORIGINS = os.getenv("FEISHU_WEB_ORIGINS", "")
    FEISHU_DEV_LOGIN_ENABLED = (
        os.getenv("FEISHU_DEV_LOGIN_ENABLED", "False").lower() == "true"
    )
    WECHAT_APP_ID = os.getenv("WECHAT_APP_ID", "")
    WECHAT_APP_SECRET = os.getenv("WECHAT_APP_SECRET", "")
    WECHAT_API_BASE = os.getenv("WECHAT_API_BASE", "https://api.weixin.qq.com")

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 24 * 7


class DevelopmentConfig(Config):
    """开发环境配置"""

    DEBUG = True
    SESSION_COOKIE_SECURE = False


class ProductionConfig(Config):
    """生产环境配置"""

    DEBUG = False


class TestingConfig(Config):
    """测试环境配置"""

    TESTING = True
    SESSION_COOKIE_SECURE = False
    FEISHU_DEV_LOGIN_ENABLED = True
    SECRET_KEY = "testing-only-secret"


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
