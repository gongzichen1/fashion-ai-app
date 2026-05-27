# Bugs And Risks

## Known Bugs

- None recorded.

## Risks

- 小程序发布前必须将 `src/frontend/config/index.js` 的本地 API 地址替换为微信后台已配置的 HTTPS 合法域名。
- “我的衣橱”目前基于已有分析记录和推荐单品生成，没有新增独立衣橱持久化模型。
- 当前仓库自带的 `src/backend/venv` 仍是 Python 3.9，因此测试会提示 Python 3.9/LibreSSL 相关环境警告；代码和文档已改为要求 Python 3.10+，上线应重建 venv。
- 新版 `google-genai` 依赖当前在测试中有第三方 Pydantic deprecation warning，不影响本项目测试通过，后续随依赖升级消除。

## Failed Attempts

- 初次后端冒烟测试发现无文件名上传图片会被拒绝，已改为读取图片头判断格式。
- 初次测试会在真实上传目录生成测试图，已改为测试中 monkeypatch 临时上传目录。

## Follow-Up

- 在微信开发者工具里做一次真机预览验收，覆盖定位授权、相机授权、拍照分析和分享入口。
