# services/image_service.py - 图片处理服务

import os
import base64
import uuid
from io import BytesIO
from PIL import Image
from colorthief import ColorThief
from config.settings import Config


class ImageService:
    """图片处理服务"""

    ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS

    @staticmethod
    def allowed_file(filename: str) -> bool:
        """检查文件扩展名是否允许"""
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ImageService.ALLOWED_EXTENSIONS

    @staticmethod
    def save_image(image_data, filename: str = None) -> str:
        """
        保存图片到服务器

        Args:
            image_data: 图片数据（可以是文件对象或base64字符串）
            filename: 文件名（可选）

        Returns:
            保存的文件路径
        """
        if not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)

        if not filename:
            filename = f"{uuid.uuid4().hex}.jpg"

        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)

        if isinstance(image_data, str):
            # base64字符串
            image_data = base64.b64decode(image_data)
            with open(filepath, 'wb') as f:
                f.write(image_data)
        else:
            # 文件对象
            image_data.save(filepath)

        return filepath

    @staticmethod
    def image_to_base64(image_path: str) -> str:
        """
        将图片转换为base64字符串

        Args:
            image_path: 图片路径

        Returns:
            base64编码的字符串
        """
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')

    @staticmethod
    def resize_image(image_path: str, max_size: tuple = (800, 800)) -> str:
        """
        调整图片大小

        Args:
            image_path: 图片路径
            max_size: 最大尺寸

        Returns:
            调整后的图片路径
        """
        with Image.open(image_path) as img:
            if img.width > max_size[0] or img.height > max_size[1]:
                img.thumbnail(max_size, Image.LANCZOS)
                img.save(image_path, optimize=True, quality=85)

        return image_path

    @staticmethod
    def extract_colors(image_path: str, color_count: int = 5) -> list:
        """
        提取图片主要颜色

        Args:
            image_path: 图片路径
            color_count: 提取的颜色数量

        Returns:
            颜色列表 [(R, G, B), ...]
        """
        try:
            color_thief = ColorThief(image_path)
            palette = color_thief.get_palette(color_count=color_count)
            return palette
        except Exception as e:
            print(f"颜色提取错误: {e}")
            return [(255, 107, 157)]  # 默认粉色

    @staticmethod
    def rgb_to_hex(rgb: tuple) -> str:
        """RGB转十六进制颜色"""
        return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

    @staticmethod
    def get_image_info(image_path: str) -> dict:
        """
        获取图片基本信息

        Args:
            image_path: 图片路径

        Returns:
            图片信息字典
        """
        with Image.open(image_path) as img:
            return {
                'width': img.width,
                'height': img.height,
                'format': img.format,
                'mode': img.mode,
                'size_bytes': os.path.getsize(image_path)
            }
