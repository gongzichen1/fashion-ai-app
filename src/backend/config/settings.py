# config/settings.py - 配置文件

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """基础配置"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'zhida-secret-key-2024')

    # 智谱AI配置
    # ZHIPU_API_KEY = os.getenv('ZHIPU_API_KEY', '')
    # ZHIPU_MODEL = 'glm-4v'  # 视觉模型，用于图像理解
    # ZHIPU_TEXT_MODEL = 'glm-4'  # 文本模型，用于推荐生成

    # Gemini配置
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    GEMINI_MODEL = 'gemini-1.5-flash'  # 多模态模型，支持文本和图像

    # 服务器配置
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5001))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

    # 上传配置
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 最大16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # 数据库配置（后续扩展用）
    DATABASE_URL = os.getenv('DATABASE_URL', '')

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
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
