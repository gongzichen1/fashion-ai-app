# 智搭统一后端

Flask API 同时服务微信小程序与飞书 H5。生产接口默认要求登录，所有业务数据按当前用户隔离；AI 未配置或调用失败时返回明确错误，不会静默生成演示结果。

## 本地启动

从项目根目录执行：

```bash
python3.11 -m venv .venv
.venv/bin/pip install -r src/backend/requirements.txt
cp src/backend/.env.example src/backend/.env
.venv/bin/python src/backend/app.py
```

至少配置 `SECRET_KEY`、AI provider 参数。飞书环境配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`；微信环境配置 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`。开发登录必须显式设置 `ALLOW_DEV_LOGIN=true`，生产禁止开启。

## 数据与图片

- 默认 `DATABASE_URL=sqlite:///...` 只适合本地或单实例 MVP，生产多实例必须替换为外部正式数据库。
- `STORAGE_BACKEND=local` 使用本地目录；设为 `cos` 时必须配置 `COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_REGION`、`COS_BUCKET`。
- 原始图片默认记录 30 天到期时间；定时执行 `FLASK_APP=src.backend.app flask cleanup-expired-images` 清理未被收藏或衣橱引用的对象。

## 核心接口

- `GET /api/health`：数据库、对象存储、AI 和飞书配置分项状态。
- `POST /api/auth/feishu/login`、`POST /api/auth/wechat/login`：建立同源会话。
- `GET /api/me`、`POST /api/auth/logout`：当前用户与登出。
- `POST /api/analyze`：鉴权图片分析，返回 `requestId` 和明确状态。
- `/api/history`、`/api/result/<id>`、`/api/favorites`、`/api/wardrobe`、`/api/preferences`、`/api/feedback`：用户隔离资源接口。

## 验证

```bash
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 .venv/bin/python -m pytest -q
.venv/bin/python -m black --check src/backend tests
.venv/bin/python -m isort --check-only src/backend tests
.venv/bin/python -m flake8 src/backend tests --exclude=src/backend/venv --select=E9,F63,F7,F82
```

完整产品状态、缺陷与飞书发布门槛见项目根目录 `docs/`。
