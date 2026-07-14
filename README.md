# 👗 穿搭AI小程序 - 智能穿搭推荐系统

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-black.svg)](https://flask.palletsprojects.com/)
[![AI](https://img.shields.io/badge/OpenAI--compatible-AI-orange.svg)](#)
[![微信小程序](https://img.shields.io/badge/微信小程序-1.06.2307260-green.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
> 🚀 一个基于大模型视觉分析的智能穿搭推荐微信小程序，通过AI图像分析为用户提供个性化服装搭配建议

## 当前状态（2026-07-14）

- `src/frontend`：保留的微信小程序前端，已补 `wx.login` 服务端会话接入，仍需真实 AppID/Secret 真机复验。
- `src/feishu-web`：新增的飞书自建 H5 前端，支持免登、拍照/相册、分析、历史、收藏、衣橱和偏好。
- `src/backend`：统一 Flask API，业务数据按用户隔离；AI 未配置或失败时返回明确错误，不再静默伪造结果。
- 数据层已支持 SQLite、MySQL 和 PostgreSQL；本地默认 SQLite，生产必须通过 `DATABASE_URL` 连接托管数据库。COS 适配器已实现但尚未使用真实凭据验收。

项目真实能力、缺陷和发布边界以 [项目概况](docs/PROJECT_OVERVIEW.md)、[功能状态](docs/FUNCTION_STATUS.md)、[缺陷清单](docs/DEFECTS.md)、[数据库与登录](docs/DATABASE_AND_AUTH.md)、[公共服装目录](docs/CLOTHING_CATALOG.md) 与 [飞书路线](docs/FEISHU_ROADMAP.md) 为准。

## ✨ 主要功能

### 🎨 核心功能
- **📸 智能图像分析**: 拍照或上传服装图片，AI自动识别服装类型、颜色、风格、材质等
- **🎯 个性化推荐**: 根据用户选择的风格偏好（优雅通勤风、甜美约会风、休闲日常风）提供定制化搭配建议
- **🗂 公共服装目录**: 对已授权素材进行去重、审核、结构化标注和鉴权配图，与用户私人衣橱隔离
- **🌤 天气穿搭**: 获取当前位置天气并给出当天穿衣建议
- **👤 个人中心**: 支持历史记录、收藏搭配、衣橱单品、风格偏好、身材信息和反馈
- **📱 移动端优化**: 专为微信小程序优化的轻量级移动端应用
- **🤖 大模型集成**: 支持OpenAI兼容多模态接口，实现图像理解和智能文本生成

### 🔧 技术特色
- **前后端分离**: Flask后端API + 微信小程序前端
- **AI驱动**: 集成OpenAI兼容多模态模型，支持复杂图像分析
- **响应式设计**: 适配不同屏幕尺寸的移动设备
- **RESTful API**: 标准化的API设计，易于扩展和维护

## 🛠️ 技术栈

### 后端 (Backend)
- **框架**: Flask 3.0+
- **AI引擎**: OpenAI兼容多模态大模型 API
- **图像处理**: Pillow, ColorThief
- **配置管理**: python-dotenv
- **跨域支持**: Flask-CORS

### 前端 (Frontend)
- **框架**: 微信小程序原生框架
- **语言**: JavaScript ES6+
- **样式**: WXSS (类似CSS)
- **模板**: WXML
- **状态管理**: 页面级状态 + 全局数据

### 开发工具
- **版本控制**: Git
- **包管理**: pip (Python), npm (可选)
- **代码质量**: Pre-commit hooks (计划中)
- **测试**: pytest (计划中)

## 📁 项目结构

```
穿搭ai项目/
├── .github/                    # GitHub配置
│   ├── workflows/             # GitHub Actions
│   └── ISSUE_TEMPLATE/        # Issue模板
├── src/
│   ├── backend/               # Flask后端服务
│   │   ├── api/              # API路由
│   │   │   ├── __init__.py
│   │   │   └── routes.py     # REST API端点
│   │   ├── services/         # 业务逻辑服务
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py # AI服务
│   │   │   ├── image_service.py # 图像处理服务
│   │   │   └── prompts.py    # AI提示词配置
│   │   ├── config/           # 配置管理
│   │   │   ├── __init__.py
│   │   │   └── settings.py   # 应用配置
│   │   ├── models/           # 数据模型
│   │   │   ├── __init__.py
│   │   │   └── data_store.py # 数据存储
│   │   ├── static/           # 静态资源
│   │   │   └── images/       # 推荐图片资源
│   │   ├── uploads/          # 用户上传文件
│   │   ├── app.py            # Flask应用入口
│   │   ├── requirements.txt  # Python依赖
│   │   └── start.sh          # 启动脚本
│   └── frontend/              # 微信小程序前端
│       ├── app.js            # 小程序入口
│       ├── app.json          # 小程序配置
│       ├── app.wxss          # 全局样式
│       ├── project.config.json # 项目配置
│       ├── pages/            # 页面
│       │   ├── index/        # 首页
│       │   ├── camera/       # 拍照页面
│       │   ├── result/       # 结果页面
│       │   ├── profile/      # 个人页面
│       │   ├── preference/   # 风格偏好
│       │   ├── bodyinfo/     # 身材信息
│       │   ├── feedback/     # 意见反馈
│       │   └── about/        # 关于我们
│       ├── config/           # 前端接口配置
│       ├── images/           # 图片资源
│       └── utils/            # 工具函数
│           ├── api.js        # API调用
│           └── util.js       # 通用工具
├── scripts/                   # 工具脚本
│   ├── generate_images.py    # 图片资源生成
│   └── 图片资源说明.md       # 资源说明
├── docs/                     # 项目文档
├── tests/                    # 测试代码
├── .gitignore               # Git忽略文件
├── README.md                # 项目说明
├── LICENSE                  # 许可证
└── requirements.txt         # 项目依赖 (根目录)
```

## 🚀 快速开始

### 📋 环境要求

- **Python**: 3.10 或更高版本
- **Node.js**: 16+ (可选，用于开发工具)
- **微信开发者工具**: 最新版本
- **Git**: 2.0+

### 🔧 安装步骤

#### 1. 克隆项目
```bash
cd 穿搭ai项目
```

#### 2. 后端设置

```bash
# 进入后端目录
cd src/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的大模型接口配置
# AI_API_URL=https://your-provider.example.com/api
# AI_API_KEY=your_api_key_here
# AI_MODEL=your_model_name_here

# 启动开发服务器
python app.py
```

#### 3. 前端设置

```bash
# 使用微信开发者工具打开前端项目
# 打开微信开发者工具 → 导入项目 → 选择 src/frontend 目录

# 或者使用命令行工具 (如果已安装)
cd src/frontend
# 编译运行 (在微信开发者工具中操作)
```

#### 4. 飞书 H5 本地开发

```bash
cd src/feishu-web
npm ci
cp .env.example .env.local
npm run dev
```

本地浏览器体验登录必须在后端显式配置 `FEISHU_DEV_LOGIN_ENABLED=True`，生产环境必须保持关闭。飞书客户端内使用时，后端必须配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_WEB_ORIGINS`；公开 App ID 会由登录 challenge 在运行时返回，无需写入前端构建。

#### 5. 同源容器构建

仓库根目录的 `Dockerfile` 会先构建飞书 H5，再将静态产物与 Flask API 打入同一个镜像：

```bash
docker build -t zhida-platform .
```

本机没有 Docker 时，可分别运行后端测试和 `npm run build`，但不能据此声称镜像构建已通过。

### ⚙️ 配置说明

#### 环境变量 (.env)
```bash
# OpenAI兼容大模型配置
AI_API_URL=https://your-provider.example.com/api
AI_API_KEY=your_api_key_here
AI_MODEL=your_model_name_here
AI_TIMEOUT=60

# Flask 配置
FLASK_ENV=development
FLASK_DEBUG=True

# 服务器配置
HOST=0.0.0.0
PORT=5001
```

#### 微信小程序配置 (project.config.json)
```json
{
  "appid": "your_miniprogram_appid",
  "projectname": "fashion-ai-app",
  "miniprogramRoot": "./",
  "setting": {
    "urlCheck": false
  }
}
```

#### 前端 API 地址
编辑 `src/frontend/config/index.js`：

```javascript
const API_BASE_URL = 'http://localhost:5001/api'; // 开发环境
// const API_BASE_URL = 'https://your-domain.com/api'; // 生产环境
```

## 📖 使用指南

### 👤 用户操作流程

1. **选择风格**: 在首页浏览并选择喜欢的穿搭风格
2. **拍照分析**: 进入拍照页面，拍摄或上传服装图片
3. **AI分析**: 系统自动分析服装特征和风格
4. **获取推荐**: 查看AI生成的个性化搭配建议

### 🔌 API 接口

#### 健康检查
```http
GET /api/live
GET /api/ready
GET /api/health
```

`/api/live` 只验证进程存活；`/api/ready` 在数据库结构、COS、AI 或飞书配置未就绪时返回 503；`/api/health` 始终返回分项诊断与布尔 `ready`。生产变量清单见 `config/production.env.example`，真实值只能通过平台密钥配置注入。

#### 服装分析
```http
POST /api/analyze
Content-Type: multipart/form-data

# 请求体
image: <服装图片文件>
style_preference: <风格偏好JSON> (可选)
```

#### 搭配推荐
```http
POST /api/recommend
Content-Type: application/json

{
  "garmentId": "服装ID",
  "scene": "使用场景",
  "analysisResult": {...}
}
```

#### 天气穿搭
```http
GET /api/weather?latitude=31.2&longitude=121.5
```

### 📱 开发调试

#### 后端调试
```bash
# 启动调试模式
export FLASK_DEBUG=True
python app.py

# 查看API文档 (浏览器访问)
http://localhost:5001
```

#### 前端调试
- 使用微信开发者工具的调试面板
- 查看控制台日志和网络请求
- 使用真机调试功能

## 🤝 贡献指南

### 📝 开发流程

1. **Fork** 本仓库
2. **创建功能分支**: `git checkout -b feature/AmazingFeature`
3. **提交更改**: `git commit -m 'Add some AmazingFeature'`
4. **推送分支**: `git push origin feature/AmazingFeature`
5. **创建 Pull Request**

### 🐛 报告问题

通过项目维护渠道报告 bug 或请求新功能。

### 📋 提交规范

```bash
# 功能提交
git commit -m "feat: 添加用户登录功能"

# 修复提交
git commit -m "fix: 修复图片上传失败的问题"

# 文档提交
git commit -m "docs: 更新API使用说明"

# 样式提交
git commit -m "style: 格式化代码风格"

# 重构提交
git commit -m "refactor: 重构用户认证模块"

# 测试提交
git commit -m "test: 添加单元测试"

# 构建提交
git commit -m "chore: 更新构建配置"
```

## 🔄 CI/CD

本项目使用 GitHub Actions 进行持续集成和部署：

- **自动化测试**: 每次推送自动运行单元测试
- **代码质量检查**: 使用 Flake8 和 Black 进行代码规范检查
- **依赖安全扫描**: 检查第三方依赖的安全漏洞

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- **OpenAI 兼容多模态模型**: 提供AI图像分析和搭配推荐能力
- **微信小程序**: 优秀的移动端开发平台
- **开源社区**: 感谢所有贡献者和灵感来源

---

## 环境要求

- Python 3.10+
- Node.js (用于微信开发者工具)
- 微信开发者工具

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

*本项目仅用于学习和研究目的*
