# api/routes.py - API路由

import os
import uuid
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app

from services import AIService, ImageService, StitchService
from config import Config

# 创建蓝图
api_bp = Blueprint('api', __name__)

# 初始化服务
ai_service = AIService()


@api_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'success': True,
        'message': '服务运行正常',
        'timestamp': datetime.now().isoformat()
    })


@api_bp.route('/analyze', methods=['POST'])
def analyze_image():
    """
    分析服装图片

    接收图片文件或base64编码的图片，返回分析结果和搭配推荐
    """
    try:
        # 获取图片数据
        if 'image' in request.files:
            # 文件上传
            file = request.files['image']
            if not file or not ImageService.allowed_file(file.filename):
                return jsonify({
                    'success': False,
                    'message': '不支持的文件格式，请上传 jpg/png/gif 格式的图片'
                }), 400

            # 保存图片
            filename = f"{uuid.uuid4().hex}_{int(time.time())}.jpg"
            filepath = ImageService.save_image(file, filename)

            # 调整图片大小
            ImageService.resize_image(filepath)

            # 转换为base64
            image_base64 = ImageService.image_to_base64(filepath)

        elif request.is_json and 'image_base64' in request.get_json():
            # Base64上传
            image_base64 = request.get_json()['image_base64']

            # 保存图片
            filename = f"{uuid.uuid4().hex}_{int(time.time())}.jpg"
            filepath = ImageService.save_image(image_base64, filename)

        else:
            return jsonify({
                'success': False,
                'message': '请上传图片或提供base64编码的图片'
            }), 400

        # 获取风格偏好（如果有）
        style_preference = None
        if 'style_preference' in request.form:
            try:
                style_preference = request.form['style_preference']
                if isinstance(style_preference, str):
                    style_preference = eval(style_preference)  # 安全考虑：实际应用中应该用json.loads
            except:
                style_preference = None

        # 调用AI分析
        analysis_result = ai_service.analyze_image(image_base64, style_preference)

        # 生成推荐
        recommendations = ai_service.generate_recommendations(analysis_result, style_preference)

        # 提取颜色信息
        try:
            colors = ImageService.extract_colors(filepath)
            primary_color = ImageService.rgb_to_hex(colors[0])
        except:
            primary_color = '#FF6B9D'

        # 构建返回结果
        result = {
            'id': uuid.uuid4().hex,
            'image': f'/uploads/{filename}',
            'garmentType': analysis_result.get('garment_type', '未知'),
            'category': analysis_result.get('category', '未知'),
            'primaryColor': primary_color,
            'colorName': analysis_result.get('color_name', '未知'),
            'styles': analysis_result.get('styles', []),
            'pattern': analysis_result.get('pattern', '未知'),
            'material': analysis_result.get('material', '未知'),
            'length': analysis_result.get('length', '未知'),
            'scenes': analysis_result.get('suitable_scenes', []),
            'seasons': analysis_result.get('suitable_seasons', []),
            'description': analysis_result.get('description', ''),
            'overallStyle': recommendations.get('overall_style', ''),
            'styleTips': recommendations.get('style_tips', ''),
            'recommendations': _format_recommendations(
                recommendations.get('recommendations', [])
            )
        }

        return jsonify({
            'success': True,
            'message': '分析成功',
            'data': result
        })

    except Exception as e:
        current_app.logger.error(f'分析错误: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'分析失败: {str(e)}'
        }), 500


@api_bp.route('/recommend', methods=['POST'])
def get_recommendations():
    """
    获取搭配推荐

    根据服装ID或分析结果获取搭配推荐
    """
    try:
        data = request.get_json()

        garment_id = data.get('garmentId')
        scene = data.get('scene', 'all')
        analysis_result = data.get('analysisResult')

        if not analysis_result:
            return jsonify({
                'success': False,
                'message': '请提供服装分析结果'
            }), 400

        # 生成推荐
        recommendations = ai_service.generate_recommendations(analysis_result)

        return jsonify({
            'success': True,
            'message': '推荐生成成功',
            'data': {
                'overallStyle': recommendations.get('overall_style', ''),
                'styleTips': recommendations.get('style_tips', ''),
                'recommendations': _format_recommendations(
                    recommendations.get('recommendations', [])
                )
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'推荐生成失败: {str(e)}'
        }), 500


@api_bp.route('/result/<result_id>', methods=['GET'])
def get_result(result_id):
    """
    获取分析结果

    根据ID获取之前保存的分析结果
    """
    # TODO: 从数据库获取结果
    return jsonify({
        'success': False,
        'message': '功能开发中'
    }), 501


@api_bp.route('/history', methods=['GET'])
def get_history():
    """
    获取历史记录

    获取用户的历史分析记录
    """
    # TODO: 从数据库获取历史记录
    return jsonify({
        'success': True,
        'data': []
    })


def _format_recommendations(recommendations: list) -> list:
    """
    格式化推荐结果，添加图片URL等

    Args:
        recommendations: 原始推荐列表

    Returns:
        格式化后的推荐列表
    """
    formatted = []
    for i, item in enumerate(recommendations):
        formatted.append({
            'id': f'rec_{i}',
            'type': item.get('type', '未知'),
            'name': item.get('name', '推荐单品'),
            'description': item.get('description', ''),
            'color': item.get('color', ''),
            'reason': item.get('reason', ''),
            'scenes': item.get('scenes', []),
            'tags': item.get('tags', []),
            # Demo版本使用占位图
            'image': f'/static/images/recommend_{i % 4 + 1}.png',
            'price': '',
            'productUrl': ''
        })

    return formatted


# ===== Stitch MCP API 路由 =====

@api_bp.route("/stitch/projects", methods=["GET"])
def get_stitch_projects():
    """
    获取Stitch项目列表
    """
    try:
        stitch_service = StitchService()
        projects = stitch_service.list_projects()

        return jsonify({
            "success": True,
            "data": projects
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>", methods=["GET"])
def get_stitch_project(project_id: str):
    """
    获取特定Stitch项目信息

    Args:
        project_id: 项目ID
    """
    try:
        stitch_service = StitchService()
        project = stitch_service.get_project(project_id)

        return jsonify({
            "success": True,
            "data": project
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs", methods=["GET"])
def get_stitch_designs(project_id: str):
    """
    获取Stitch项目中的所有设计

    Args:
        project_id: 项目ID
    """
    try:
        stitch_service = StitchService()
        designs = stitch_service.list_designs(project_id)

        return jsonify({
            "success": True,
            "data": designs
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs/<design_id>", methods=["GET"])
def get_stitch_design(project_id: str, design_id: str):
    """
    获取特定Stitch设计信息

    Args:
        project_id: 项目ID
        design_id: 设计ID
    """
    try:
        stitch_service = StitchService()
        design = stitch_service.get_design(project_id, design_id)

        return jsonify({
            "success": True,
            "data": design
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs/<design_id>/components", methods=["GET"])
def get_stitch_design_components(project_id: str, design_id: str):
    """
    获取Stitch设计中的所有组件

    Args:
        project_id: 项目ID
        design_id: 设计ID
    """
    try:
        stitch_service = StitchService()
        components = stitch_service.get_design_components(project_id, design_id)

        return jsonify({
            "success": True,
            "data": components
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs/<design_id>/analyze", methods=["POST"])
def analyze_stitch_design(project_id: str, design_id: str):
    """
    分析Stitch设计组件

    Request Body:
    {
        "component_ids": ["component_id_1", "component_id_2"]
    }
    """
    try:
        data = request.get_json()
        component_ids = data.get("component_ids", [])

        if not component_ids:
            return jsonify({"success": False, "message": "请提供要分析的组件ID"}), 400

        stitch_service = StitchService()
        results = stitch_service.analyze_design_components(project_id, design_id, component_ids)

        return jsonify({
            "success": True,
            "data": results
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs/<design_id>/export/<component_id>", methods=["GET"])
def export_stitch_component(project_id: str, design_id: str, component_id: str):
    """
    导出Stitch组件为图片

    Query Parameters:
    - format: PNG/SVG/JPG (default: PNG)
    - scale: 0.1-4.0 (default: 1.0)
    """
    try:
        format_param = request.args.get("format", "PNG")
        scale_param = float(request.args.get("scale", 1.0))

        stitch_service = StitchService()
        image_data = stitch_service.export_component(
            project_id, design_id, component_id, format_param, scale_param
        )

        if image_data:
            from flask import send_file
            from io import BytesIO

            # 根据格式设置MIME类型
            mime_types = {
                "PNG": "image/png",
                "JPG": "image/jpeg",
                "SVG": "image/svg+xml"
            }

            mime_type = mime_types.get(format_param.upper(), "image/png")

            return send_file(
                BytesIO(image_data),
                mimetype=mime_type,
                as_attachment=True,
                download_name=f"stitch_component_{component_id}.{format_param.lower()}"
            )
        else:
            return jsonify({"success": False, "message": "导出失败"}), 404

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs/<design_id>/export", methods=["GET"])
def export_stitch_design(project_id: str, design_id: str):
    """
    导出整个Stitch设计为图片

    Query Parameters:
    - format: PNG/SVG/JPG (default: PNG)
    - scale: 0.1-4.0 (default: 1.0)
    """
    try:
        format_param = request.args.get("format", "PNG")
        scale_param = float(request.args.get("scale", 1.0))

        stitch_service = StitchService()
        image_data = stitch_service.export_design(
            project_id, design_id, format_param, scale_param
        )

        if image_data:
            from flask import send_file
            from io import BytesIO

            mime_types = {
                "PNG": "image/png",
                "JPG": "image/jpeg",
                "SVG": "image/svg+xml"
            }

            mime_type = mime_types.get(format_param.upper(), "image/png")

            return send_file(
                BytesIO(image_data),
                mimetype=mime_type,
                as_attachment=True,
                download_name=f"stitch_design_{design_id}.{format_param.lower()}"
            )
        else:
            return jsonify({"success": False, "message": "导出失败"}), 404

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs", methods=["POST"])
def create_stitch_design(project_id: str):
    """
    从图片创建设计

    Request Body:
    {
        "image": "base64_encoded_image",
        "name": "设计名称"
    }
    """
    try:
        data = request.get_json()
        image_base64 = data.get("image")
        design_name = data.get("name", "新设计")

        if not image_base64:
            return jsonify({"success": False, "message": "请提供图片数据"}), 400

        # 解码base64图片
        import base64
        image_data = base64.b64decode(image_base64)

        stitch_service = StitchService()
        result = stitch_service.create_design_from_image(project_id, image_data, design_name)

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/designs/<design_id>/variations", methods=["GET"])
def get_stitch_design_variations(project_id: str, design_id: str):
    """
    获取设计的变体版本

    Args:
        project_id: 项目ID
        design_id: 设计ID
    """
    try:
        stitch_service = StitchService()
        variations = stitch_service.get_design_variations(project_id, design_id)

        return jsonify({
            "success": True,
            "data": variations
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@api_bp.route("/stitch/projects/<project_id>/screens/<screen_id>/assets", methods=["GET"])
def download_stitch_screen_assets(project_id: str, screen_id: str):
    """
    下载Stitch屏幕资产

    Args:
        project_id: 项目ID
        screen_id: 屏幕ID
    """
    try:
        stitch_service = StitchService()
        assets = stitch_service.download_screen_assets(project_id, screen_id)

        return jsonify({
            "success": True,
            "data": assets
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
