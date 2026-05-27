# api/routes.py - API路由

import uuid
import time
import json
from datetime import datetime
import requests
from flask import Blueprint, request, jsonify, current_app

from services import AIService, ImageService
from config import Config
from models.data_store import db

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
            if not file:
                return jsonify({
                    'success': False,
                    'message': '请上传图片'
                }), 400

            # 保存图片
            ext = _get_upload_extension(file)
            if not ext:
                return jsonify({
                    'success': False,
                    'message': '不支持的文件格式，请上传 jpg/png/gif/webp 格式的图片'
                }), 400

            filename = f"{uuid.uuid4().hex}_{int(time.time())}.{ext}"
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
                    style_preference = json.loads(style_preference)
            except (json.JSONDecodeError, TypeError):
                style_preference = None

        # 调用AI分析
        analysis_result = ai_service.analyze_image(image_base64, style_preference)

        # 生成推荐
        recommendations = ai_service.generate_recommendations(analysis_result, style_preference)

        # 提取颜色信息
        try:
            colors = ImageService.extract_colors(filepath)
            primary_color = ImageService.rgb_to_hex(colors[0])
        except (IndexError, TypeError, ValueError):
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

        db.insert('results', result.copy())

        return jsonify({
            'success': True,
            'message': '分析成功',
            'data': result
        })

    except Exception as e:
        current_app.logger.exception('分析错误: %s', e)
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
        data = request.get_json(silent=True) or {}

        scene = data.get('scene', 'all')
        analysis_result = data.get('analysisResult')

        if not analysis_result:
            return jsonify({
                'success': False,
                'message': '请提供服装分析结果'
            }), 400

        # 生成推荐
        recommendations = ai_service.generate_recommendations(analysis_result)
        formatted = _format_recommendations(recommendations.get('recommendations', []))
        if scene != 'all':
            formatted = [
                item for item in formatted
                if scene in item.get('scenes', [])
            ]

        return jsonify({
            'success': True,
            'message': '推荐生成成功',
            'data': {
                'overallStyle': recommendations.get('overall_style', ''),
                'styleTips': recommendations.get('style_tips', ''),
                'recommendations': formatted
            }
        })

    except Exception as e:
        current_app.logger.exception('推荐生成失败: %s', e)
        return jsonify({
            'success': False,
            'message': f'推荐生成失败: {str(e)}'
        }), 500


@api_bp.route('/weather', methods=['GET'])
def get_weather():
    """根据经纬度获取当前天气和穿搭建议。"""
    try:
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)

        if latitude is None or longitude is None:
            return jsonify({
                'success': False,
                'message': '请提供 latitude 和 longitude'
            }), 400

        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            return jsonify({
                'success': False,
                'message': '经纬度范围不合法'
            }), 400

        weather = _fetch_current_weather(latitude, longitude)

        return jsonify({
            'success': True,
            'message': '获取成功',
            'data': weather
        })

    except Exception as e:
        current_app.logger.exception('天气获取错误: %s', e)
        return jsonify({
            'success': False,
            'message': f'天气获取失败: {str(e)}'
        }), 500


@api_bp.route('/result/<result_id>', methods=['GET'])
def get_result(result_id):
    """
    获取分析结果

    根据ID获取之前保存的分析结果
    """
    result = db.find_one('results', {'id': result_id})
    if result:
        return jsonify({
            'success': True,
            'message': '获取成功',
            'data': result
        })

    return jsonify({
        'success': False,
        'message': '结果不存在'
    }), 404


@api_bp.route('/history', methods=['GET'])
def get_history():
    """
    获取历史记录

    获取用户的历史分析记录
    """
    return jsonify({
        'success': True,
        'data': db.find_many('results', limit=50)
    })


def _fetch_current_weather(latitude: float, longitude: float) -> dict:
    """调用 Open-Meteo 获取当前天气。"""
    response = requests.get(
        'https://api.open-meteo.com/v1/forecast',
        params={
            'latitude': latitude,
            'longitude': longitude,
            'current': 'temperature_2m,weather_code,wind_speed_10m',
            'timezone': 'auto'
        },
        timeout=8
    )
    response.raise_for_status()
    data = response.json()
    current = data.get('current') or {}

    temperature = round(float(current.get('temperature_2m', 0)))
    weather_code = int(current.get('weather_code', 0))
    wind_speed = round(float(current.get('wind_speed_10m', 0)))

    return {
        'temperature': temperature,
        'condition': _weather_code_text(weather_code),
        'weatherCode': weather_code,
        'windSpeed': wind_speed,
        'windText': _wind_text(wind_speed),
        'outfitAdvice': _outfit_advice(temperature, weather_code, wind_speed),
        'latitude': latitude,
        'longitude': longitude,
        'updatedAt': current.get('time') or datetime.now().isoformat()
    }


def _weather_code_text(code: int) -> str:
    weather_map = {
        0: '晴',
        1: '大部晴朗',
        2: '多云',
        3: '阴',
        45: '雾',
        48: '雾凇',
        51: '小毛毛雨',
        53: '毛毛雨',
        55: '大毛毛雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        80: '阵雨',
        81: '较强阵雨',
        82: '强阵雨',
        95: '雷雨'
    }
    return weather_map.get(code, '天气')


def _wind_text(wind_speed: int) -> str:
    if wind_speed < 12:
        return '微风'
    if wind_speed < 29:
        return '有风'
    return '风较大'


def _outfit_advice(temperature: int, weather_code: int, wind_speed: int) -> str:
    rainy_codes = {51, 53, 55, 61, 63, 65, 80, 81, 82, 95}
    snowy_codes = {71, 73, 75}

    if temperature <= 5:
        advice = '羽绒服或厚大衣，内搭保暖针织。'
    elif temperature <= 12:
        advice = '大衣或棉服，搭配长裤和围巾。'
    elif temperature <= 20:
        advice = '薄外套、针织衫或卫衣更合适。'
    elif temperature <= 27:
        advice = '衬衫、T恤或轻薄套装即可。'
    else:
        advice = '短袖、轻薄裙装或透气面料更舒适。'

    if weather_code in rainy_codes:
        advice += ' 记得带伞，鞋子选防滑款。'
    elif weather_code in snowy_codes:
        advice += ' 注意防滑，外层选择防风保暖。'
    elif wind_speed >= 29:
        advice += ' 风大，建议加防风外套。'

    return advice


def _get_upload_extension(file) -> str:
    """从文件名或 MIME 类型推断上传图片扩展名。"""
    filename = file.filename or ''
    if ImageService.allowed_file(filename):
        return filename.rsplit('.', 1)[1].lower()

    mimetype_map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    }
    if file.mimetype in mimetype_map:
        return mimetype_map[file.mimetype]

    position = file.stream.tell()
    header = file.stream.read(32)
    file.stream.seek(position)
    if header.startswith(b'\xff\xd8\xff'):
        return 'jpg'
    if header.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'png'
    if header.startswith((b'GIF87a', b'GIF89a')):
        return 'gif'
    if header.startswith(b'RIFF') and header[8:12] == b'WEBP':
        return 'webp'

    return None


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
