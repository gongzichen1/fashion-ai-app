# Project Context

## Current Goal

- 上线前验证与发布准备。

## Project Facts

- 项目是微信小程序 + Flask 后端的穿搭 AI 应用。
- 前端目录：`src/frontend`。
- 后端目录：`src/backend`。
- 本地旧 venv：`src/backend/venv`，Python 3.9.6，仅适合当前本地回归，不适合作为上线环境。
- CloudBase 云托管公网域名：`https://zhida-api-264856-5-1259394189.sh.run.tcloudbase.com`。
- AI 服务已改为 OpenAI 兼容接口配置，通过 `AI_API_URL`、`AI_API_KEY`、`AI_MODEL`、`AI_TIMEOUT` 环境变量读取。

## Constraints

- 默认最小改动，不做无关重构。
- 上线前配置必须由用户确认，包括 HTTPS API 域名、微信合法域名、生产 `.env`、模型 API Key 和真机预览结果。

## Decisions

- 生产后端应使用 Python 3.10+ 重建 venv。
- 已将 `src/frontend/config/index.js` 切换到 CloudBase HTTPS API 地址。
- 用户明确统一使用 `https://agione.cc/hyperone/xapi/api` 和模型 `minimax/minimax-m2.7/b1d92`；密钥只应配置在 CloudBase 环境变量中，不写入仓库文件。

## Useful Commands

- `src/backend/venv/bin/python -m pytest -q`
- `src/backend/venv/bin/python -m black --check src/backend tests`
- `src/backend/venv/bin/python -m isort --check-only src/backend tests`
- `src/backend/venv/bin/python -m flake8 src/backend tests --exclude=src/backend/venv --count --select=E9,F63,F7,F82 --show-source --statistics`
