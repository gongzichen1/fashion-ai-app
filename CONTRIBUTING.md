# 🤝 贡献指南

感谢你对穿搭AI小程序项目的兴趣！我们欢迎各种形式的贡献，无论是代码、文档、设计还是想法。

## 📋 贡献前准备

### 1. 了解项目
- 阅读 [README.md](../README.md) 了解项目概况
- 查看 [项目结构](../README.md#项目结构) 了解代码组织
- 运行项目并体验功能

### 2. 查找任务
- 查看 [GitHub Issues](https://github.com/YOUR_USERNAME/fashion-ai-app/issues) 寻找待解决的问题
- 查看 [项目看板](https://github.com/YOUR_USERNAME/fashion-ai-app/projects) 了解开发进度
- 参与讨论和提出新想法

## 🚀 开发流程

### 1. Fork 项目
点击右上角的 "Fork" 按钮，将项目复制到你的 GitHub 账户下。

### 2. 克隆到本地
```bash
git clone https://github.com/YOUR_USERNAME/fashion-ai-app.git
cd fashion-ai-app
```

### 3. 创建功能分支
```bash
# 为新功能创建分支
git checkout -b feature/amazing-feature

# 为修复bug创建分支
git checkout -b fix/bug-description

# 为文档更新创建分支
git checkout -b docs/update-readme
```

### 4. 安装开发依赖
```bash
# 后端
cd src/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 前端 (微信开发者工具中操作)
```

### 5. 进行开发
- 遵循项目的代码规范
- 编写有意义的提交信息
- 及时提交更改

### 6. 提交更改
```bash
# 添加更改的文件
git add .

# 提交更改 (使用规范的提交信息)
git commit -m "feat: 添加用户登录功能"

# 推送分支
git push origin feature/amazing-feature
```

### 7. 创建 Pull Request
1. 访问你的 Fork 仓库
2. 点击 "Compare & pull request"
3. 填写 PR 描述，参考 [PR 模板](../.github/PULL_REQUEST_TEMPLATE.md)
4. 提交 PR

## 📝 提交规范

我们使用 [Conventional Commits](https://conventionalcommits.org/) 规范：

```bash
# 主要类型
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码风格调整 (不影响逻辑)
refactor: 代码重构
test:     测试相关
chore:    构建/工具相关

# 示例
git commit -m "feat: 添加用户风格偏好选择功能"
git commit -m "fix: 修复拍照页面崩溃问题"
git commit -m "docs: 更新API使用文档"
git commit -m "style: 格式化后端代码"
```

## 🧪 测试要求

### 后端测试
```bash
cd src/backend
python -m pytest tests/ -v --cov=.
```

### 前端测试
- 使用微信开发者工具进行真机调试
- 测试不同设备和网络条件
- 验证用户体验流程

## 🎨 代码规范

### Python (后端)
- 使用 [Black](https://black.readthedocs.io/) 进行代码格式化
- 使用 [Flake8](https://flake8.pycqa.org/) 进行代码检查
- 使用 [isort](https://pycqa.github.io/isort/) 进行导入排序

### JavaScript (前端)
- 使用 ESLint 进行代码检查
- 遵循微信小程序开发规范
- 使用有意义的变量和函数命名

## 📚 文档要求

### 代码注释
- 为复杂函数添加文档字符串
- 解释重要的算法和业务逻辑
- 使用中文注释 (项目主要使用中文)

### API 文档
- 更新 [API 接口](../README.md#api-接口) 部分
- 提供请求/响应示例
- 说明错误处理

## 🔧 开发环境

### 推荐工具
- **Python**: 3.8+
- **微信开发者工具**: 最新版本
- **Git**: 2.30+
- **VS Code**: 推荐扩展 (Python, WXML, WXSS)

### 环境配置
```bash
# 安装开发依赖 (可选)
pip install black flake8 isort pre-commit

# 配置 pre-commit hooks
pre-commit install
```

## 🤔 贡献类型

### 💻 代码贡献
- 修复现有bug
- 实现新功能
- 优化性能
- 重构代码

### 📖 文档贡献
- 完善 README.md
- 编写使用教程
- API 文档更新
- 代码注释

### 🎨 设计贡献
- UI/UX 改进建议
- 图标和资源优化
- 用户体验优化

### 🧪 测试贡献
- 编写单元测试
- 集成测试
- E2E 测试

### 🌐 翻译贡献
- 多语言支持
- 文档翻译

## 📞 沟通渠道

- **GitHub Issues**: 报告问题和建议
- **GitHub Discussions**: 讨论功能和想法
- **Pull Request 评论**: 代码审查反馈

## 🙏 行为准则

- 保持友好和尊重
- 提供建设性反馈
- 遵循开源精神
- 保护用户隐私

## 🏆 贡献者认可

所有贡献者都会：
- 在贡献者列表中列出
- 获得项目徽章
- 参与项目决策 (重要贡献者)

## 📋 检查清单

提交 PR 前请检查：

- [ ] 代码遵循项目规范
- [ ] 通过所有测试
- [ ] 更新相关文档
- [ ] 添加必要的测试
- [ ] 提交信息规范
- [ ] PR 描述完整

---

感谢你的贡献！让我们一起让穿搭AI小程序变得更好！ 🎉