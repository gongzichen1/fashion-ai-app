# config/settings.py - 配置文件

import os

from dotenv import load_dotenv

load_dotenv()


BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(BASE_DIR))


class Config:
    """基础配置"""

    SECRET_KEY = os.getenv("SECRET_KEY", "zhida-secret-key-2024")

    # OpenAI-compatible LLM配置
    AI_API_URL = os.getenv("AI_API_URL", os.getenv("MINIMAX_API_URL", ""))
    AI_API_KEY = os.getenv("AI_API_KEY", os.getenv("MINIMAX_API_KEY", ""))
    AI_MODEL = os.getenv("AI_MODEL", os.getenv("MINIMAX_MODEL", ""))
    AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", os.getenv("MINIMAX_TIMEOUT", 60)))

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
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")


class DevelopmentConfig(Config):
    """开发环境配置"""

    DEBUG = True


class ProductionConfig(Config):
    """生产环境配置"""

    DEBUG = False


class TestingConfig(Config):
    """测试环境配置"""

    TESTING = True


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
