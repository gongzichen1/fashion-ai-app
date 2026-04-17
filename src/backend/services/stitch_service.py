# services/stitch_service.py - Stitch MCP服务

import os
import requests
import base64
from typing import Dict, List, Optional


class StitchService:
    """
    Stitch MCP服务类
    提供与Google Stitch设计工具的MCP集成功能
    """

    def __init__(self):
        self.base_url = "https://stitch.googleapis.com/mcp"
        self.api_key = os.getenv("STITCH_API_KEY", "")

        if not self.api_key:
            raise ValueError("STITCH_API_KEY 环境变量未设置")

        self.headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
        }

    def _make_request(
        self, method: str, endpoint: str, data: Optional[Dict] = None
    ) -> Dict:
        """
        发起HTTP请求的通用方法

        Args:
            method: HTTP方法 (GET, POST, etc.)
            endpoint: API端点
            data: 请求数据

        Returns:
            响应数据字典
        """
        try:
            url = f"{self.base_url}{endpoint}"

            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(
                    url, headers=self.headers, json=data, timeout=30
                )
            else:
                raise ValueError(f"不支持的HTTP方法: {method}")

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(
                    f"API请求失败: {response.status_code} - {response.text}"
                )

        except requests.RequestException as e:
            raise Exception(f"网络请求错误: {str(e)}")

    def list_projects(self) -> List[Dict]:
        """
        获取用户的所有项目列表

        Returns:
            项目列表
        """
        return self._make_request("GET", "/projects")

    def get_project(self, project_id: str) -> Dict:
        """
        获取特定项目的信息

        Args:
            project_id: 项目ID

        Returns:
            项目信息字典
        """
        return self._make_request("GET", f"/projects/{project_id}")

    def list_designs(self, project_id: str) -> List[Dict]:
        """
        获取项目中的所有设计

        Args:
            project_id: 项目ID

        Returns:
            设计列表
        """
        return self._make_request("GET", f"/projects/{project_id}/designs")

    def get_design(self, project_id: str, design_id: str) -> Dict:
        """
        获取特定设计的信息

        Args:
            project_id: 项目ID
            design_id: 设计ID

        Returns:
            设计信息字典
        """
        return self._make_request("GET", f"/projects/{project_id}/designs/{design_id}")

    def export_design(
        self, project_id: str, design_id: str, format: str = "PNG", scale: float = 1.0
    ) -> Optional[bytes]:
        """
        导出设计为图片

        Args:
            project_id: 项目ID
            design_id: 设计ID
            format: 导出格式 (PNG, SVG, JPG)
            scale: 缩放比例

        Returns:
            图片二进制数据
        """
        try:
            endpoint = f"/projects/{project_id}/designs/{design_id}/export"
            data = {"format": format.upper(), "scale": scale}

            response = requests.post(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                json=data,
                timeout=30,
            )

            if response.status_code == 200:
                return response.content
            else:
                raise Exception(f"导出失败: {response.status_code} - {response.text}")

        except requests.RequestException as e:
            raise Exception(f"网络请求错误: {str(e)}")

    def get_design_components(self, project_id: str, design_id: str) -> List[Dict]:
        """
        获取设计中的所有组件

        Args:
            project_id: 项目ID
            design_id: 设计ID

        Returns:
            组件列表
        """
        return self._make_request(
            "GET", f"/projects/{project_id}/designs/{design_id}/components"
        )

    def get_component(self, project_id: str, design_id: str, component_id: str) -> Dict:
        """
        获取特定组件的信息

        Args:
            project_id: 项目ID
            design_id: 设计ID
            component_id: 组件ID

        Returns:
            组件信息字典
        """
        return self._make_request(
            "GET",
            f"/projects/{project_id}/designs/{design_id}/components/{component_id}",
        )

    def export_component(
        self,
        project_id: str,
        design_id: str,
        component_id: str,
        format: str = "PNG",
        scale: float = 1.0,
    ) -> Optional[bytes]:
        """
        导出组件为图片

        Args:
            project_id: 项目ID
            design_id: 设计ID
            component_id: 组件ID
            format: 导出格式
            scale: 缩放比例

        Returns:
            组件图片二进制数据
        """
        try:
            endpoint = (
                f"/projects/{project_id}/designs/{design_id}/components/"
                f"{component_id}/export"
            )
            data = {"format": format.upper(), "scale": scale}

            response = requests.post(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                json=data,
                timeout=30,
            )

            if response.status_code == 200:
                return response.content
            else:
                raise Exception(f"导出失败: {response.status_code} - {response.text}")

        except requests.RequestException as e:
            raise Exception(f"网络请求错误: {str(e)}")

    def analyze_design_components(
        self, project_id: str, design_id: str, component_ids: List[str]
    ) -> List[Dict]:
        """
        使用AI分析设计组件 (与AI服务集成)

        Args:
            project_id: 项目ID
            design_id: 设计ID
            component_ids: 要分析的组件ID列表

        Returns:
            分析结果列表
        """
        from .ai_service import AIService

        ai_service = AIService()
        results = []

        for comp_id in component_ids:
            # 导出组件图片
            image_data = self.export_component(project_id, design_id, comp_id)

            if image_data:
                # 转换为base64
                image_base64 = base64.b64encode(image_data).decode("utf-8")

                # AI分析
                try:
                    analysis = ai_service.analyze_image(
                        image_base64, {"style": "ui_design"}
                    )

                    results.append(
                        {
                            "component_id": comp_id,
                            "analysis": analysis,
                            "image_size": len(image_data),
                        }
                    )

                except Exception as e:
                    results.append({"component_id": comp_id, "error": str(e)})

        return results

    def create_design_from_image(
        self, project_id: str, image_data: bytes, design_name: str
    ) -> Dict:
        """
        从图片创建新设计 (AI生成)

        Args:
            project_id: 项目ID
            image_data: 图片二进制数据
            design_name: 设计名称

        Returns:
            创建的设计信息
        """
        try:
            # 将图片转换为base64
            image_base64 = base64.b64encode(image_data).decode("utf-8")

            data = {
                "name": design_name,
                "image": image_base64,
                "generateVariations": True,
            }

            return self._make_request("POST", f"/projects/{project_id}/designs", data)

        except Exception as e:
            raise Exception(f"创建设计失败: {str(e)}")

    def get_design_variations(self, project_id: str, design_id: str) -> List[Dict]:
        """
        获取设计的变体版本

        Args:
            project_id: 项目ID
            design_id: 设计ID

        Returns:
            变体列表
        """
        return self._make_request(
            "GET", f"/projects/{project_id}/designs/{design_id}/variations"
        )

    def update_component_properties(
        self, project_id: str, design_id: str, component_id: str, properties: Dict
    ) -> Dict:
        """
        更新组件属性

        Args:
            project_id: 项目ID
            design_id: 设计ID
            component_id: 组件ID
            properties: 要更新的属性

        Returns:
            更新后的组件信息
        """
        endpoint = (
            f"/projects/{project_id}/designs/{design_id}/components/{component_id}"
        )
        return self._make_request("PATCH", endpoint, properties)

    def download_screen_assets(self, project_id: str, screen_id: str) -> Dict:
        """
        下载指定屏幕的资产（图像和代码）

        Args:
            project_id: 项目ID
            screen_id: 屏幕ID

        Returns:
            包含图像URL和代码的字典
        """
        try:
            # MCP请求获取屏幕资产
            mcp_request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "stitch.screens.getAssets",
                "params": {
                    "projectId": project_id,
                    "screenId": screen_id
                }
            }

            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=mcp_request,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                if "result" in result:
                    return result["result"]
                else:
                    raise Exception(f"MCP响应错误: {result}")
            else:
                raise Exception(f"MCP请求失败: {response.status_code} - {response.text}")

        except requests.RequestException as e:
            raise Exception(f"网络请求错误: {str(e)}")