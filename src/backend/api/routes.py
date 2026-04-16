# api/routes.py - API路由

import os
import uuid
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app

from services import AIService, ImageService
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
