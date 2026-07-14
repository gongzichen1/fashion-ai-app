# Bugs And Risks

## Known Bugs

- None recorded.

## Risks

- 小程序发布前必须将 `src/frontend/config/index.js` 的本地 API 地址替换为微信后台已配置的 HTTPS 合法域名。
- “我的衣橱”目前基于已有分析记录和推荐单品生成，没有新增独立衣橱持久化模型。
- 当前仓库自带的 `src/backend/venv` 仍是 Python 3.9，因此测试会提示 Python 3.9/LibreSSL 相关环境警告；代码和文档已改为要求 Python 3.10+，上线应重建 venv。
- 当前 Homebrew Python 3.14.5 未安装 Flask、python-dotenv、pytest 等项目依赖；不能直接视为可用上线环境。
- 生产环境需要确认 `DEBUG=False`、非默认 `SECRET_KEY`、真实模型 API Key 和 CORS 范围。
- 微信开发者工具 CLI 已生成真机预览二维码，但定位、相机、相册上传、真实 AI 分析、保存图片、分享入口仍需要用户在手机上扫码人工验收。
- `2026-06-03` 一次修正中首页 `index.wxss` 多出一个 `}`，微信开发者工具仅报 `compile_start code 10`，已定位并修复；后续遇到同类错误优先检查 WXSS 语法。
- 本机 Docker CLI 存在但 Docker 后台未运行，因此未完成本地镜像构建验证；需要依赖 CloudBase 构建日志或启动 Docker 后复验。
- CloudBase 云托管容器本地文件系统不适合作为长期持久化存储；当前服务端历史结果可能随实例重启丢失，正式长期用户数据应接 CloudBase 数据库/对象存储。
- CloudBase 默认域名页面提示仅限开发测试且存在访问频率、功能和稳定性限制；正式长期运营建议后续绑定自定义域名。
- 当前 CloudBase 最小实例数为 0，首次访问可能冷启动变慢；发布验收前应预热访问 `/api/health`。
- AI 大模型密钥不得提交到仓库；只能放在 CloudBase 环境变量或本地 `.env`。
- 新模型接口的视觉输入兼容性尚未用真实图片在 CloudBase 上验收；重新部署并配置环境变量后必须测试 `/api/analyze`。

## Failed Attempts

- 初次后端冒烟测试发现无文件名上传图片会被拒绝，已改为读取图片头判断格式。
- 初次测试会在真实上传目录生成测试图，已改为测试中 monkeypatch 临时上传目录。

## Follow-Up

- 在微信开发者工具里做一次真机预览验收，覆盖定位授权、相机授权、相册上传、真实 AI 分析、保存图片、分享入口和个人页各入口。
