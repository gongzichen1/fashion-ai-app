# app.py - Flask主应用

import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入配置和路由
from config import Config, config
from api import api_bp


def create_app(config_name='default'):
    """
    创建Flask应用实例

    Args:
        config_name: 配置名称（development/production/testing）

    Returns:
        Flask应用实例
    """
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config[config_name])

    # 启用CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # 确保上传目录存在
    if not os.path.exists(Config.UPLOAD_FOLDER):
        os.makedirs(Config.UPLOAD_FOLDER)

    # 注册蓝图
    app.register_blueprint(api_bp, url_prefix='/api')

    # 静态文件路由 - 用于访问上传的图片
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # 静态文件路由 - 用于访问静态资源
    @app.route('/static/<path:filename>')
    def static_files(filename):
        static_folder = os.path.join(os.path.dirname(__file__), 'static')
        return send_from_directory(static_folder, filename)

    # 根路由
    @app.route('/')
    def index():
        return {
            'name': '智搭API服务',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'health': '/api/health',
                'analyze': '/api/analyze (POST)',
                'recommend': '/api/recommend (POST)',
                'result': '/api/result/<id> (GET)',
                'history': '/api/history (GET)'
            }
        }

    # 错误处理
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': '接口不存在'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'success': False, 'message': '服务器内部错误'}, 500

    return app


# 创建应用实例
app = create_app(os.getenv('FLASK_ENV', 'development'))


if __name__ == '__main__':
    print(f"""
    ╔════════════════════════════════════════════╗
    ║         智搭 - 后端服务已启动              ║
    ╠════════════════════════════════════════════╣
    ║  API地址: http://{Config.HOST}:{Config.PORT}           ║
    ║  文档: 访问根路径查看可用接口              ║
    ╚════════════════════════════════════════════╝
    """)

    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
