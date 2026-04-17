# Stitch MCP 使用示例

本文档介绍如何在项目中使用 Stitch MCP 服务进行设计工具集成。

## 环境配置

在使用 Stitch 服务之前，需要设置环境变量：

```bash
export STITCH_API_KEY="your_stitch_api_key_here"
```

## 基本使用

### 初始化服务

```python
from services.stitch_service import StitchService

# 服务会自动从环境变量读取API密钥
stitch_service = StitchService()
```

### 获取项目列表

```python
projects = stitch_service.list_projects()
for project in projects:
    print(f"项目: {project['name']} (ID: {project['id']})")
```

### 下载屏幕资产

```python
# 下载特定屏幕的资产
assets = stitch_service.download_screen_assets(
    project_id="your_project_id",
    screen_id="your_screen_id"
)

print("屏幕资产:", assets)
```

## API 端点

### 获取项目列表
```
GET /api/stitch/projects
```

### 下载屏幕资产
```
GET /api/stitch/projects/{project_id}/screens/{screen_id}/assets
```

### 导出组件图片
```
GET /api/stitch/projects/{project_id}/designs/{design_id}/export/{component_id}?format=PNG&scale=1.0
```

## MCP 协议

Stitch 使用 MCP (Model Context Protocol) 进行通信，所有请求都通过 JSON-RPC 2.0 格式发送。

### 请求格式
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "stitch.screens.getAssets",
  "params": {
    "projectId": "project_id",
    "screenId": "screen_id"
  }
}
```

### 响应格式
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "images": ["https://..."],
    "code": "..."
  }
}
```

## 错误处理

服务会抛出异常，需要适当处理：

```python
try:
    assets = stitch_service.download_screen_assets(project_id, screen_id)
except ValueError as e:
    print(f"配置错误: {e}")
except Exception as e:
    print(f"API错误: {e}")
```

## 安全注意事项

- 永远不要将 API 密钥硬编码在代码中
- 使用环境变量或安全的密钥管理服务
- 定期轮换 API 密钥
- 监控 API 使用情况