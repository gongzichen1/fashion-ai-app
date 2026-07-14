# Project Context

## Current Goal

- 将智搭整理为“微信小程序保留 + 飞书 H5 + Flask 统一 API”的企业内部可用平台，并完成真实飞书、外部数据库、COS 与 AI 的发布验收。

## Project Facts

- 微信小程序：`src/frontend`；飞书 H5：`src/feishu-web`；统一后端：`src/backend`。
- H5 构建产物可由 Flask 同源提供，根目录 `Dockerfile` 负责 Node 构建和 Python 运行时组装。
- 后端已实现飞书 OAuth v2、微信 jscode2session、同源会话、SQLite 用户隔离、local/COS 图片存储适配器和图片到期清理 CLI。
- CloudBase 旧版本公网域名：`https://zhida-api-264856-5-1259394189.sh.run.tcloudbase.com`；旧线上 `/api/analyze` 仍会返回固定假结果，必须部署本轮代码后复验。

## Constraints

- 企业内部飞书自建 H5 为一期范围；不含虚拟试衣、虚假商品价格或购买链接。
- SQLite 与本地上传目录只用于本地/单实例 MVP；生产多实例必须使用外部数据库和私有 COS。
- 密钥只允许通过平台环境变量或密钥管理注入，不写入仓库。

## Decisions

- 普通浏览器生产环境不开放开发登录；飞书 JSSDK 失败需显示真实错误。
- 所有业务资源按 `owner_user_id` 强制过滤；图片由同源鉴权代理读取。
- 原图默认保留 30 天；收藏或衣橱引用可转为长期资产。
- AI 失败不再静默返回假结果；仅显式开发配置可启用 demo mode。

## Useful Commands

- `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 .venv/bin/python -m pytest -q`
- `.venv/bin/python -m black --check src/backend tests`
- `.venv/bin/python -m isort --check-only src/backend tests`
- `cd src/feishu-web && npm run build`
- `FLASK_APP=src.backend.app .venv/bin/flask cleanup-expired-images`
