#!/usr/bin/env python3
"""
图片资源生成脚本
运行此脚本将SVG图标转换为PNG格式，并生成占位图

使用方法:
pip install cairosvg pillow
python generate_images.py
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("请先安装Pillow: pip install Pillow")
    sys.exit(1)

# 图片保存目录
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'frontend', 'images')
BACKEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', 'static', 'images')

# 确保目录存在
os.makedirs(FRONTEND_DIR, exist_ok=True)
os.makedirs(BACKEND_DIR, exist_ok=True)


def create_png_icon(filename, size, color, shape='circle'):
    """创建简单的PNG图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if shape == 'circle':
        draw.ellipse([size//4, size//4, size*3//4, size*3//4], fill=color)
    elif shape == 'square':
        draw.rectangle([size//4, size//4, size*3//4, size*3//4], fill=color)
    elif shape == 'home':
        # 简单的房子形状
        draw.polygon([
            (size//2, size//6),  # 顶点
            (size//6, size//2),  # 左
            (size*5//6, size//2)  # 右
        ], fill=color)
        draw.rectangle([size//3, size//2, size*2//3, size*5//6], fill=color)
    elif shape == 'camera':
        # 相机形状
        draw.rectangle([size//6, size//3, size*5//6, size*5//6], fill=color)
        draw.ellipse([size//3, size//2, size*2//3, size*4//5], fill='white')
        draw.ellipse([size*2//5, size//2+size//8, size*3//5, size//2+size//4], fill=color)
    elif shape == 'user':
        # 用户形状
        draw.ellipse([size//3, size//6, size*2//3, size//2], fill=color)
        draw.polygon([
            (size//6, size*5//6),
            (size//2, size//2),
            (size*5//6, size*5//6)
        ], fill=color)

    img.save(os.path.join(FRONTEND_DIR, filename))
    print(f"创建: {filename}")


def create_placeholder_image(filename, width, height, text, bg_color='#FFF5F7', text_color='#666666'):
    """创建占位图"""
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # 绘制边框
    border_color = '#E0E0E0'
    draw.rectangle([10, 10, width-10, height-10], outline=border_color, width=2)

    # 绘制文字
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 20)
    except:
        font = ImageFont.load_default()

    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    draw.text((x, y), text, fill=text_color, font=font)

    img.save(os.path.join(BACKEND_DIR, filename))
    print(f"创建: {filename}")


def main():
    print("=" * 50)
    print("  图片资源生成工具")
    print("=" * 50)
    print()

    primary_color = '#FF6B9D'
    active_color = '#FF6B9D'
    inactive_color = '#999999'

    # TabBar图标 (81x81 像素，推荐)
    print("生成TabBar图标...")
    create_png_icon('tab-home.png', 81, inactive_color, 'home')
    create_png_icon('tab-home-active.png', 81, active_color, 'home')
    create_png_icon('tab-camera.png', 81, inactive_color, 'camera')
    create_png_icon('tab-camera-active.png', 81, active_color, 'camera')
    create_png_icon('tab-profile.png', 81, inactive_color, 'user')
    create_png_icon('tab-profile-active.png', 81, active_color, 'user')

    # 功能图标 (48x48 像素)
    print("\n生成功能图标...")
    create_png_icon('icon-camera.png', 48, primary_color, 'camera')
    create_png_icon('icon-style.png', 48, primary_color, 'circle')
    create_png_icon('icon-body.png', 48, primary_color, 'user')
    create_png_icon('icon-feedback.png', 48, primary_color, 'square')
    create_png_icon('icon-about.png', 48, primary_color, 'circle')
    create_png_icon('icon-ai.png', 48, primary_color, 'circle')  # AI分析图标
    create_png_icon('icon-match.png', 48, primary_color, 'circle')  # 搭配推荐图标
    create_png_icon('icon-shop.png', 48, primary_color, 'square')  # 商品链接图标

    # 大图标 (120x120 像素)
    print("\n生成大图标...")
    create_png_icon('camera-big.png', 120, primary_color, 'camera')

    # 风格图片 (300x300 像素)
    print("\n生成风格图片...")
    create_placeholder_image('style-1.png', 300, 300, '优雅通勤风')
    create_placeholder_image('style-2.png', 300, 300, '甜美约会风')
    create_placeholder_image('style-3.png', 300, 300, '休闲日常风')

    # 占位图 (400x400 像素)
    print("\n生成占位图...")
    create_placeholder_image('recommend_1.png', 400, 400, '上衣示例')
    create_placeholder_image('recommend_2.png', 400, 400, '鞋子示例')
    create_placeholder_image('recommend_3.png', 400, 400, '包包示例')
    create_placeholder_image('recommend_4.png', 400, 400, '配饰示例')

    # Logo
    print("\n生成Logo...")
    logo = Image.new('RGBA', (200, 200), (0, 0, 0, 0))
    draw = ImageDraw.Draw(logo)
    draw.ellipse([10, 10, 190, 190], fill='#FF6B9D')
    logo.save(os.path.join(FRONTEND_DIR, 'logo.png'))
    print("创建: logo.png")

    print("\n" + "=" * 50)
    print("  图片资源生成完成!")
    print("=" * 50)
    print(f"\n图片保存位置:")
    print(f"  前端: {FRONTEND_DIR}")
    print(f"  后端: {BACKEND_DIR}")


if __name__ == '__main__':
    main()
