# Task Progress

## Active Task

- **外部阻塞：**数据库、登录、COS adapter、同源镜像和验收工具已完成；GitHub Secret/production environment 均为空，本地仅有 SQLite 且无 COS、飞书、真实 AI 或 CloudBase CLI，无法执行真实部署和双账号双端验收。

## Success Criteria

- 飞书移动/桌面免登、媒体选择、真实 AI 分析、历史/收藏/衣橱与偏好同步均通过。
- 两个飞书账号互不可见数据；删除与 30 天清理同时覆盖数据库和对象存储。
- 容器重启、多实例和换设备后数据保持一致；微信核心流程不回归。
- AI、非法图片和网络失败均返回真实可追踪错误，不生成假结果。

## Plan

- 创建飞书自建网页应用，配置主页、权限、可信域名和可用范围。
- 创建托管 MySQL/PostgreSQL 实例，注入 `DATABASE_URL`，接入真实私有 COS 并配置平台定时清理。
- 部署根目录镜像，验证 health、飞书 JSSDK、AI 与双账号隔离。
- 进行 5–20 人内部试运行，达到核心链路 95% 后再扩大范围。

## Completed

- 建立基线提交 `3523c38`，保留既有微信 UI 改动。
- 原 ZIP 移入忽略的 `archive/source-assets/`；旧 React 原型和微信预览产物移入 `archive/`。
- 完成 `docs/PROJECT_OVERVIEW.md`、`FUNCTION_STATUS.md`、`DEFECTS.md`、`GITHUB_CASES.md`、`FEISHU_ROADMAP.md`。
- 完成飞书 React/Vite 移动优先 H5：首页、媒体上传、结果、历史、收藏、衣橱、偏好和个人中心。
- 完成统一后端认证、用户隔离资源 API、明确 AI 错误、分项 health、local/COS 存储和生命周期清理。
- 微信小程序已接入后端微信登录与会话 Cookie，保留原核心流程。
- Python 3.12 干净 `.venv` 下 42 项测试通过、2 项 MySQL/PostgreSQL 集成测试因本地无服务跳过；飞书 H5 的 `ttfile` 文件系统转换 2 项测试和生产构建通过；本轮增量远端 CI 待提交后复核。
- 已用 `FileSystemManager.readFile` 替代对 `ttfile://` 的直接 fetch，并在媒体选择和分享前强制完成 JSSDK 鉴权。
- 飞书 App ID 改为由后端 challenge 在运行时返回；同一镜像无需构建参数即可切换环境。
- GitHub Actions 已替换假部署：提交 `f18ceb7` 的 37 项后端/H5/安全审计、MySQL 8.4、PostgreSQL 16 和 Docker 同源镜像构建全部通过；手动 CloudBase 部署及部署后验证已就位。
- COS readiness 已改为真实 `head_bucket` 检查；删除分析后保留的图片会在收藏/衣橱最后一个引用移除时同步删除。
- 新增 `scripts/verify_two_account_isolation.py`，可分别用移动端和桌面端的两个真实会话自动验证列表、ID、图片、收藏、衣橱、删除与最后引用生命周期。
- 建立公共服装目录：`catalog_items` 内容哈希唯一索引、审核状态/品类索引、私有图片接口、推荐配图匹配、去重盘点与清单导入；旧上传目录 45 张得到 18 个唯一内容、6 个测试资产和 12 个待授权候选，自动批准 0 张。
- 修复部署验证与真实 health 的 `ready` 字段契约不一致；新增 liveness/readiness、数据库结构检查、数据库/COS 写入 preflight，CloudBase 部署先执行 CLI dry-run。
- COS 模式改为仅在系统临时目录处理上传，成功、AI 失败或业务写入失败后均删除容器临时原图。
- 旧 CloudBase `/` 与 `/api/health` 已恢复快速 200；旧 `/api/analyze` 实测仍返回固定粉色裙子假结果，证明必须重新部署。

## Next Step

- 应用所有者先创建托管 MySQL/PostgreSQL、私有 COS 和飞书自建网页应用，在 CloudBase 注入生产环境变量，并在 GitHub 配置 `TCB_SECRET_ID`、`TCB_SECRET_KEY`、`TCB_ENV_ID`、`TCB_SERVICE_NAME`、`PRODUCTION_BASE_URL`。恢复任务后执行部署，再用移动端和桌面端各两个真实飞书会话运行双账号验收；通过前不进入机器人/卡片/天气提醒阶段。
- 图片资产所有者按 `docs/CLOTHING_CATALOG.md` 对 12 个候选逐张确认来源、授权和标签；未确认项保持在线不可见。
