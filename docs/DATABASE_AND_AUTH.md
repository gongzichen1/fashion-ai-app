# 飞书数据库与用户登录说明

## 1. 登录方式

一期不建立用户名/密码体系，直接使用飞书企业身份免登：

`飞书 requestAccess/requestAuthCode → POST /api/auth/feishu/login → 后端向飞书换取用户身份 → users 映射 → Secure/HttpOnly/SameSite 会话 Cookie`

- 飞书 `open_id` 会映射为唯一 `external_id=feishu:<open_id>`；同一账号重复或并发登录复用同一内部用户。
- 前端不能读取会话 Cookie，业务 API 从服务端会话取得当前用户。
- 所有历史、结果、收藏、衣橱、偏好和反馈查询都同时带 `owner_user_id`。
- 生产必须保持 `FEISHU_DEV_LOGIN_ENABLED=False`，普通浏览器不能绕过飞书身份。

## 2. 数据库

数据层支持：

- 本地开发：`sqlite:///fashion_ai.db`
- 腾讯云 MySQL：`mysql+pymysql://user:password@host:3306/fashion_ai?charset=utf8mb4`
- PostgreSQL：`postgresql+psycopg://user:password@host:5432/fashion_ai`

核心数据集为 `users`、`results`、`recommendations`、`favorites`、`wardrobe_items`、`user_profiles`、`feedback`。业务表建立 owner 索引，`users.external_id` 建立唯一索引。

生产连接串只通过 CloudBase 密钥环境变量 `DATABASE_URL` 注入。数据库密码含 `@`、`:`、`/` 等字符时必须 URL 编码，不得提交 `.env`、截图或连接串。

## 3. 飞书生产环境变量

```dotenv
FLASK_ENV=production
SECRET_KEY=<长期随机密钥>
DATABASE_URL=<托管 MySQL 或 PostgreSQL 连接串>
FEISHU_APP_ID=<飞书应用 ID>
FEISHU_APP_SECRET=<飞书应用密钥>
FEISHU_DEV_LOGIN_ENABLED=False
CORS_ORIGINS=https://<同源业务域名>
```

图片还需配置私有 COS；AI provider 参数见 `src/backend/.env.example`。

## 4. 上线验收

1. 使用两个真实飞书账号分别免登，确认内部用户 ID 不同。
2. 同一账号重复登录，确认只产生一个 `users` 记录。
3. A/B 分别创建分析、收藏和衣橱；互查 ID、列表、图片和删除全部返回不可见。
4. 容器重启和多实例切换后，登录与数据仍存在。
5. 数据库断开时 `/api/health` 的 database 状态为 error，业务发布立即停止。
6. 执行数据库备份与恢复演练，记录恢复时间和回滚负责人。

当前代码已完成上述身份映射和隔离逻辑，但真实托管数据库、真实飞书凭据及双账号验收仍属于部署动作，未完成前不能标记正式上线。
