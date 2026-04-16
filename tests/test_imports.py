import pytest
import sys
import os

# 添加后端路径到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

def test_app_import():
    """测试应用是否能正常导入"""
    try:
        from app import create_app
        app = create_app('testing')
        assert app is not None
        print("✅ 应用导入成功")
    except ImportError as e:
        pytest.fail(f"应用导入失败: {e}")

def test_config_import():
    """测试配置是否能正常导入"""
    try:
        from config.settings import Config
        assert Config is not None
        print("✅ 配置导入成功")
    except ImportError as e:
        pytest.fail(f"配置导入失败: {e}")

def test_ai_service_import():
    """测试AI服务是否能正常导入"""
    try:
        from services.ai_service import AIService
        # 注意：这里不实例化，因为需要API密钥
        assert AIService is not None
        print("✅ AI服务导入成功")
    except ImportError as e:
        pytest.fail(f"AI服务导入失败: {e}")

def test_api_routes_import():
    """测试API路由是否能正常导入"""
    try:
        from api.routes import api_bp
        assert api_bp is not None
        print("✅ API路由导入成功")
    except ImportError as e:
        pytest.fail(f"API路由导入失败: {e}")

def test_image_service_import():
    """测试图像服务是否能正常导入"""
    try:
        from services.image_service import ImageService
        assert ImageService is not None
        print("✅ 图像服务导入成功")
    except ImportError as e:
        pytest.fail(f"图像服务导入失败: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])