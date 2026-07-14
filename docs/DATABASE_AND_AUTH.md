# 飞书数据库与用户登录说明

## 1. 登录方式

一期不建立用户名/密码体系，直接使用飞书企业身份免登：

`后端生成一次性 state → 飞书 requestAccess/requestAuthCode → POST /api/auth/feishu/login → 校验 state → 后端向飞书换取用户身份 → users 映射 → Secure/HttpOnly/SameSite 会话 Cookie`

- 飞书 `open_id` 会映射为唯一 `external_id=feishu:<open_id>`；同一账号重复或并发登录复用同一内部用户。
- 前端不能读取会话 Cookie，业务 API 从服务端会话取得当前用户。
- 所有历史、结果、收藏、衣橱、偏好和反馈查询都同时带 `owner_user_id`。
- 生产必须保持 `FEISHU_DEV_LOGIN_ENABLED=False`，普通浏览器不能绕过飞书身份。

## 2. 数据库

数据层支持：

- 本地开发：`sqlite:///fashion_ai.db`
- 腾讯云 MySQL：`mysql+pymysql://user:password@host:3306/fashion_ai?charset=utf8mb4`
- PostgreSQL：`postgresql+psycopg://user:password@host:5432/fashion_ai`

核心数据集为 `users`、`results`、`recommendations`、`favorites`、`wardrobe_items`、`user_profiles`、`feedback` 和独立公共目录 `catalog_items`。用户业务表建立 owner 索引，`users.external_id` 建立唯一索引；公共目录按内容哈希去重，并按审核状态、品类建立索引。

生产连接串只通过 CloudBase 密钥环境变量 `DATABASE_URL` 注入。数据库密码含 `@`、`:`、`/` 等字符时必须 URL 编码，不得提交 `.env`、截图或连接串。

## 3. 飞书生产环境变量

```dotenv
FLASK_ENV=production
SECRET_KEY=<长期随机密钥>
DATABASE_URL=<托管 MySQL 或 PostgreSQL 连接串>
FEISHU_APP_ID=<飞书应用 ID>
FEISHU_APP_SECRET=<飞书应用密钥>
FEISHU_DEV_LOGIN_ENABLED=False
FEISHU_WEB_ORIGINS=https://<同源业务域名>
CORS_ORIGINS=https://<同源业务域名>
```

图片还需配置私有 COS；AI provider 参数见 `src/backend/.env.example`。
完整无密钥模板见 `config/production.env.example`。配置完成后，在与生产相同的容器环境执行：

```bash
FLASK_ENV=production flask --app app production-preflight --write-probes
```

该命令检查所有业务表与必要列，在回滚事务中验证数据库写入，并在 COS 的 `healthchecks/` 前缀完成一次随机对象写、读、删；不输出连接串、密钥或 provider 异常原文。未输出 `production_preflight_ok` 时停止发布。

## 4. 上线验收

1. 使用两个真实飞书账号分别免登，确认内部用户 ID 不同。
2. 同一账号重复登录，确认只产生一个 `users` 记录。
3. A/B 分别创建分析、收藏和衣橱；互查 ID、列表、图片和删除全部返回不可见。
4. 容器重启和多实例切换后，登录与数据仍存在。
5. 数据库断开或结构缺失时 `/api/ready` 返回 503，`/api/health` 的 database 状态为 error，业务发布立即停止。
6. 执行数据库备份与恢复演练，记录恢复时间和回滚负责人。

当前代码已完成上述身份映射和隔离逻辑，但真实托管数据库、真实飞书凭据及双账号验收仍属于部署动作，未完成前不能标记正式上线。

## 5. 双账号自动验收

部署后分别从飞书移动端、桌面端取得两个测试账号的独立会话，保存为仓库外的临时 Cookie header 文件或 Playwright storage state。文件必须设置仅当前用户可读，禁止提交仓库、粘贴到聊天或写入 CI 日志。

移动端与桌面端各执行一次：

```bash
chmod 600 /secure/a.cookie /secure/b.cookie
.venv/bin/python scripts/verify_two_account_isolation.py \
  --base-url https://<生产域名> \
  --account-a /secure/a.cookie \
  --account-b /secure/b.cookie \
  --client mobile \
  --image /secure/authorized-test-image.jpg \
  --confirm-production-test
```

桌面端把 `--client` 改为 `desktop`。工具会先拒绝 SQLite、本地存储、未就绪 AI/飞书配置，再创建两条真实分析，验证跨账号结果、图片、收藏、衣橱和删除不可见，验证重复添加幂等以及最后一个引用删除后 COS 原图同步删除，最后清理测试数据。只有两次均输出 `two_account_isolation_verified` 才能通过双端验收。
