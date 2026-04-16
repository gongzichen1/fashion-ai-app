# 穿搭AI小程序 - 基于Gemini的智能穿搭推荐系统

## 项目简介

这是一个基于微信小程序的智能穿搭推荐系统，使用Google Gemini AI进行图像分析和个性化搭配推荐。

## 主要功能

- 📸 **智能拍照分析**: 拍照或上传服装图片，AI自动识别服装类型、颜色、风格等
- 🎨 **个性化推荐**: 根据用户选择的风格偏好提供定制化搭配建议  
- 📱 **微信小程序**: 轻量级移动端应用，操作便捷
- 🤖 **Gemini AI集成**: 强大的多模态AI能力，支持图像理解和文本生成

## 技术栈

- **前端**: 微信小程序 (WXML/JS/CSS)
- **后端**: Flask + Python
- **AI**: Google Gemini API
- **图像处理**: PIL, OpenCV
- **部署**: 支持本地开发和生产环境

## 项目结构

```
穿搭ai项目/
├── src/
│   ├── backend/          # Flask后端服务
│   │   ├── api/         # API路由
│   │   ├── services/    # AI服务和业务逻辑
│   │   └── config/      # 配置管理
│   └── frontend/        # 微信小程序前端
│       ├── pages/       # 页面组件
│       ├── components/  # 公共组件
│       └── utils/       # 工具函数
├── scripts/             # 工具脚本
├── docs/               # 项目文档
└── tests/              # 测试代码
```

## 快速开始

### 后端设置
1. 进入后端目录: `cd src/backend`
2. 安装依赖: `pip install -r requirements.txt`
3. 配置环境变量: 复制 `.env.example` 为 `.env` 并填入你的Gemini API密钥
4. 启动服务: `python app.py`

### 前端设置
1. 使用微信开发者工具打开 `src/frontend` 目录
2. 编译运行小程序

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
