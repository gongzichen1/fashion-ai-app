# 👗 穿搭AI小程序 - 基于Gemini的智能穿搭推荐系统

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-black.svg)](https://flask.palletsprojects.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange.svg)](https://ai.google.dev/)
[![微信小程序](https://img.shields.io/badge/微信小程序-1.06.2307260-green.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/fashion-ai-app.svg)](https://github.com/YOUR_USERNAME/fashion-ai-app/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/fashion-ai-app.svg)](https://github.com/YOUR_USERNAME/fashion-ai-app/issues)

> 🚀 一个基于Google Gemini AI的智能穿搭推荐微信小程序，通过AI图像分析为用户提供个性化服装搭配建议

## ✨ 主要功能

### 🎨 核心功能
- **📸 智能图像分析**: 拍照或上传服装图片，AI自动识别服装类型、颜色、风格、材质等
- **🎯 个性化推荐**: 根据用户选择的风格偏好（优雅通勤风、甜美约会风、休闲日常风）提供定制化搭配建议
- **📱 移动端优化**: 专为微信小程序优化的轻量级移动端应用
- **🤖 Gemini AI集成**: 利用Google Gemini的强大多模态AI能力，实现精准的图像理解和智能文本生成

### 🔧 技术特色
- **前后端分离**: Flask后端API + 微信小程序前端
- **AI驱动**: 集成最新Gemini AI模型，支持复杂图像分析
- **响应式设计**: 适配不同屏幕尺寸的移动设备
- **RESTful API**: 标准化的API设计，易于扩展和维护

## 🛠️ 技术栈

### 后端 (Backend)
- **框架**: Flask 3.0+
- **AI引擎**: Google Gemini AI API
- **图像处理**: PIL, OpenCV
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
│   │   │   ├── ai_service.py # Gemini AI服务
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
│       ├── components/       # 公共组件
│       │   ├── camera-panel/ # 相机组件
│       │   ├── loading/      # 加载组件
│       │   └── result-card/  # 结果卡片组件
│       ├── pages/            # 页面
│       │   ├── index/        # 首页
│       │   ├── camera/       # 拍照页面
│       │   ├── result/       # 结果页面
│       │   └── profile/      # 个人页面
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

- **Python**: 3.8 或更高版本
- **Node.js**: 16+ (可选，用于开发工具)
- **微信开发者工具**: 最新版本
- **Git**: 2.0+

### 🔧 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/YOUR_USERNAME/fashion-ai-app.git
cd fashion-ai-app
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
# 编辑 .env 文件，填入你的 Gemini API 密钥
# GEMINI_API_KEY=your_api_key_here

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

### ⚙️ 配置说明

#### 环境变量 (.env)
```bash
# Gemini AI 配置
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-pro-vision

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

## 📖 使用指南

### 👤 用户操作流程

1. **选择风格**: 在首页浏览并选择喜欢的穿搭风格
2. **拍照分析**: 进入拍照页面，拍摄或上传服装图片
3. **AI分析**: 系统自动分析服装特征和风格
4. **获取推荐**: 查看AI生成的个性化搭配建议

### 🔌 API 接口

#### 健康检查
```http
GET /api/health
```

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

使用 [GitHub Issues](https://github.com/YOUR_USERNAME/fashion-ai-app/issues) 报告bug或请求新功能。

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

## 📊 项目统计

![GitHub语言统计](https://img.shields.io/github/languages/top/YOUR_USERNAME/fashion-ai-app)
![GitHub代码大小](https://img.shields.io/github/repo-size/YOUR_USERNAME/fashion-ai-app)
![GitHub最后提交](https://img.shields.io/github/last-commit/YOUR_USERNAME/fashion-ai-app)

## 🔄 CI/CD

本项目使用 GitHub Actions 进行持续集成和部署：

- **自动化测试**: 每次推送自动运行单元测试
- **代码质量检查**: 使用 Flake8 和 Black 进行代码规范检查
- **依赖安全扫描**: 检查第三方依赖的安全漏洞

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- **Google Gemini AI**: 提供强大的AI图像分析能力
- **微信小程序**: 优秀的移动端开发平台
- **开源社区**: 感谢所有贡献者和灵感来源

## 📞 联系我们

- **项目主页**: [GitHub Repository](https://github.com/YOUR_USERNAME/fashion-ai-app)
- **问题反馈**: [GitHub Issues](https://github.com/YOUR_USERNAME/fashion-ai-app/issues)
- **邮箱**: your-email@example.com

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by [Your Name]

</div>

## 环境要求

- Python 3.8+
- Node.js (用于微信开发者工具)
- 微信开发者工具

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

*本项目仅用于学习和研究目的*
