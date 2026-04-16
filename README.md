# 智搭 - 智能穿搭助手

> 基于 AI 视觉识别的服装搭配推荐小程序

## 项目简介

智搭是一款利用 AI 技术帮助用户进行服装搭配推荐的小程序。用户只需拍摄或上传服装照片，AI 即可分析服装特征并推荐合适的搭配方案。

## 项目结构

```
穿搭ai项目/
├── docs/                    # 文档目录
│   └── 产品需求文档-智搭.doc # 产品需求文档（Word格式）
│
├── src/                     # 源代码目录
│   ├── frontend/            # 前端代码（小程序）
│   │   ├── pages/           # 页面
│   │   ├── components/      # 组件
│   │   ├── utils/           # 工具函数
│   │   └── assets/          # 静态资源
│   │
│   ├── backend/             # 后端代码
│   │   ├── api/             # API 接口
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   └── config/          # 配置文件
│   │
│   └── ai-service/          # AI 服务
│       ├── image_analysis/  # 图像分析
│       ├── recommendation/  # 推荐算法
│       └── prompts/         # AI 提示词
│
├── assets/                  # 项目资源
│   ├── images/              # 图片资源
│   └── icons/               # 图标资源
│
├── config/                  # 项目配置
│   └── settings.json        # 全局配置
│
├── tests/                   # 测试目录
│   ├── unit/                # 单元测试
│   └── e2e/                 # 端到端测试
│
└── README.md                # 项目说明
```

## 技术栈

### 前端
- 微信小程序 / Uni-app
- Vant Weapp / uView UI 框架

### 后端
- Node.js / Python Flask
- MySQL / MongoDB
- Redis

### AI 服务
- GLM-5（智谱AI）- 文本生成
- GLM-4V（智谱AI）- 图像理解

## 核心功能

1. **拍照识别** - 拍摄或上传服装图片
2. **AI 分析** - 识别服装类型、颜色、风格等特征
3. **搭配推荐** - 智能推荐搭配方案
4. **商品链接** - 提供推荐商品购买链接

## 快速开始

```bash
# 克隆项目
cd ~/Desktop/穿搭ai项目

# 安装依赖（待创建后）
# npm install

# 启动开发服务器（待创建后）
# npm run dev
```

## 开发进度

- [x] 项目初始化
- [x] 产品需求文档
- [ ] 前端框架搭建
- [ ] 后端 API 开发
- [ ] AI 服务接入
- [ ] 测试与上线

## 联系方式

项目创建日期：2026年4月16日
