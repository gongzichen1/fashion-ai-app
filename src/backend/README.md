# 后端服务说明

## 环境要求

- Python 3.8+
- pip

## 安装步骤

### 1. 创建虚拟环境

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入配置：

```bash
cp .env.example .env
```

必填配置：
- `ZHIPU_API_KEY`: 智谱AI的API密钥

### 4. 启动服务

```bash
python app.py
```

服务默认运行在 http://localhost:5000

## API接口

### GET /api/health
健康检查

### POST /api/analyze
分析服装图片，返回搭配推荐

请求方式：
- 文件上传：`multipart/form-data`，字段名为 `image`
- Base64上传：`application/json`，字段名为 `image_base64`

### POST /api/recommend
根据分析结果生成推荐

### GET /api/result/<id>
获取历史分析结果

### GET /api/history
获取历史记录列表

## 目录结构

```
backend/
├── api/                 # API路由
│   └── routes.py        # 路由定义
├── services/            # 业务服务
│   ├── ai_service.py    # AI服务
│   └── image_service.py # 图片处理
├── models/              # 数据模型
├── config/              # 配置
├── uploads/             # 上传文件存储
├── static/              # 静态资源
├── app.py               # 应用入口
└── requirements.txt     # 依赖列表
```

## 开发说明

### 添加新的API接口

1. 在 `api/routes.py` 中添加路由函数
2. 使用 `@api_bp.route()` 装饰器定义路由
3. 返回 JSON 格式响应

### 修改AI提示词

编辑 `services/ai_service.py` 中的 `prompt` 变量

### 调整图片处理

编辑 `services/image_service.py`
