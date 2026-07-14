# services/ai_service.py - AI服务封装

import base64
import json
import logging
import re

import requests
from config.settings import Config

logger = logging.getLogger(__name__)


class AIServiceError(RuntimeError):
    """可对外识别的 AI 服务错误。"""


class AIService:
    """AI服务类 - 封装OpenAI兼容大模型调用"""

    def __init__(self):
        self.api_url = self._normalize_chat_url(Config.AI_API_URL)
        self.api_key = Config.AI_API_KEY
        self.model = Config.AI_MODEL
        self.timeout = Config.AI_TIMEOUT

        if self.api_url and self.api_key and self.model:
            logger.info("AI服务已配置OpenAI兼容接口，模型: %s", self.model)
        else:
            logger.warning("AI_API_URL/AI_API_KEY/AI_MODEL 未完整配置")

    @staticmethod
    def _normalize_chat_url(api_url: str) -> str:
        """兼容传入base url或完整chat completions url。"""
        api_url = (api_url or "").strip().rstrip("/")
        if not api_url:
            return ""
        if api_url.endswith("/chat/completions"):
            return api_url
        return f"{api_url}/chat/completions"

    def _configured(self) -> bool:
        return bool(self.api_url and self.api_key and self.model)

    def _extract_json(self, text: str) -> dict:
        """从模型返回中提取JSON对象。"""
        text = (text or "").strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            raise

    def _chat_completion(self, messages: list) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }

        response = requests.post(
            self.api_url, headers=headers, json=payload, timeout=self.timeout
        )
        response.raise_for_status()
        body = response.json()
        choices = body.get("choices") or []
        if not choices:
            raise ValueError("模型响应缺少choices")

        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, list):
            content = "".join(
                item.get("text", "") for item in content if isinstance(item, dict)
            )
        if not content:
            raise ValueError("模型响应内容为空")
        return content

    def analyze_image(self, image_base64: str, style_preference: dict = None) -> dict:
        """
        分析服装图片

        Args:
            image_base64: Base64编码的图片
            style_preference: 用户风格偏好（可选）

        Returns:
            服装分析结果
        """
        preference_text = ""
        if not self._configured():
            if Config.AI_DEMO_MODE:
                return self._get_default_analysis()
            raise AIServiceError("AI_SERVICE_NOT_CONFIGURED")

        if style_preference:
            preference_text = f"""
用户偏好信息：
- 喜欢的风格：{style_preference.get('preferred_styles', '无特别偏好')}
- 常穿场景：{style_preference.get('common_scenes', '无特别偏好')}
- 预算范围：{style_preference.get('budget', '无特别限制')}

请根据用户偏好调整分析结果，使其更符合用户的风格偏好。
"""

        prompt = f"""你是一位专业的时尚搭配顾问。请分析这张服装图片，并以JSON格式返回以下信息：

{{
    "garment_type": "服装类型（如：连衣裙、半身裙、T恤、衬衫等）",
    "category": "服装分类（如：裙装、上装、下装、外套等）",
    "primary_color": "主色调的十六进制颜色值",
    "color_name": "主色调中文名称",
    "secondary_colors": ["辅助色1", "辅助色2"],
    "styles": ["风格标签1", "风格标签2"],
    "pattern": "图案类型（纯色/条纹/格子/印花等）",
    "material": "推测的材质",
    "length": "长度描述（如：短款/中长款/长款）",
    "suitable_scenes": ["适合场景1", "适合场景2"],
    "suitable_seasons": ["适合季节"],
    "description": "服装整体描述（50字以内）"
}}

{preference_text}

请只返回JSON数据，不要包含其他文字。"""

        try:
            image_base64 = image_base64.strip()
            content = [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                },
            ]
            result_text = self._chat_completion([{"role": "user", "content": content}])
            result = self._extract_json(result_text)
            return result

        except Exception as e:
            logger.exception("AI分析失败: %s", e)
            raise AIServiceError("AI_ANALYSIS_FAILED") from e

    def generate_recommendations(
        self, analysis_result: dict, user_preference: dict = None
    ) -> dict:
        """
        生成搭配推荐

        Args:
            analysis_result: 服装分析结果
            user_preference: 用户偏好（可选）

        Returns:
            搭配推荐结果
        """
        preference_text = ""
        if not self._configured():
            if Config.AI_DEMO_MODE:
                return self._get_default_recommendations(analysis_result)
            raise AIServiceError("AI_SERVICE_NOT_CONFIGURED")

        if user_preference:
            preference_text = f"""
用户偏好信息：
- 喜欢的风格：{user_preference.get('preferred_styles', '无特别偏好')}
- 常穿场景：{user_preference.get('common_scenes', '无特别偏好')}
- 预算范围：{user_preference.get('budget', '无特别限制')}
"""

        prompt = f"""你是一位专业的时尚搭配顾问。请根据以下服装分析结果，给出专业的搭配推荐。

服装分析结果：
- 类型：{analysis_result.get('garment_type', '未知')}
- 分类：{analysis_result.get('category', '未知')}
- 主色调：{analysis_result.get('color_name', '未知')}（{analysis_result.get('primary_color', '未知')}）
- 风格：{', '.join(analysis_result.get('styles', []))}
- 图案：{analysis_result.get('pattern', '未知')}
- 适合场景：{', '.join(analysis_result.get('suitable_scenes', []))}
- 适合季节：{', '.join(analysis_result.get('suitable_seasons', []))}
{preference_text}

请以JSON格式返回搭配推荐：

{{
    "overall_style": "整体搭配风格名称",
    "style_tips": "穿搭建议和注意事项（100字以内）",
    "recommendations": [
        {{
            "type": "搭配类型（上装/下装/外套/鞋子/包包/配饰）",
            "name": "推荐单品名称",
            "description": "单品描述",
            "color": "推荐颜色",
            "reason": "推荐理由（50字以内）",
            "scenes": ["适用场景"],
            "tags": ["标签1", "标签2"]
        }}
    ]
}}

推荐规则：
1. 根据服装类型推荐3-5个搭配单品
2. 如果是裙装，推荐上装、鞋子、包包、配饰
3. 如果是上装，推荐下装、鞋子、包包
4. 颜色搭配要协调，可以采用同色系、对比色或经典搭配
5. 考虑场景的适配性

        请只返回JSON数据，不要包含其他文字。"""

        try:
            result_text = self._chat_completion([{"role": "user", "content": prompt}])
            result = self._extract_json(result_text)
            return result

        except Exception as e:
            logger.exception("推荐生成失败: %s", e)
            raise AIServiceError("AI_RECOMMENDATION_FAILED") from e

    def _get_default_analysis(self) -> dict:
        """返回默认的分析结果"""
        return {
            "garment_type": "裙子",
            "category": "裙装",
            "primary_color": "#FF6B9D",
            "color_name": "粉红色",
            "secondary_colors": ["白色"],
            "styles": ["优雅", "甜美"],
            "pattern": "纯色",
            "material": "棉质",
            "length": "中长款",
            "suitable_scenes": ["约会", "通勤"],
            "suitable_seasons": ["春", "夏"],
            "description": "这是一件优雅的粉红色中长款裙子，适合日常穿着。",
        }

    def _get_default_recommendations(self, analysis: dict) -> dict:
        """返回默认的推荐结果"""
        return {
            "overall_style": "优雅通勤风",
            "style_tips": "建议搭配简约风格的配饰，避免过于复杂的设计，保持整体的优雅感。",
            "recommendations": [
                {
                    "type": "上装",
                    "name": "白色简约衬衫",
                    "description": "经典白色衬衫，修身剪裁",
                    "color": "白色",
                    "reason": "白色衬衫是百搭单品，与粉色裙子形成清新优雅的搭配",
                    "scenes": ["通勤", "约会"],
                    "tags": ["简约", "百搭"],
                },
                {
                    "type": "鞋子",
                    "name": "米色尖头高跟鞋",
                    "description": "舒适的米色高跟鞋，8cm跟高",
                    "color": "米色",
                    "reason": "米色高跟鞋延伸腿部线条，与粉色裙子搭配显气质",
                    "scenes": ["通勤", "约会", "聚会"],
                    "tags": ["优雅", "显高"],
                },
                {
                    "type": "包包",
                    "name": "白色链条包",
                    "description": "小巧精致的白色链条单肩包",
                    "color": "白色",
                    "reason": "白色链条包简约精致，与整体搭配协调",
                    "scenes": ["约会", "聚会"],
                    "tags": ["精致", "百搭"],
                },
                {
                    "type": "配饰",
                    "name": "珍珠耳环",
                    "description": "简约珍珠耳钉",
                    "color": "白色",
                    "reason": "珍珠耳环增添优雅气质，不抢夺服装风采",
                    "scenes": ["通勤", "约会", "聚会"],
                    "tags": ["优雅", "精致"],
                },
            ],
        }
