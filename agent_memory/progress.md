# Task Progress

## Active Task

- 数据库与登录代码已完成；下一步是在 CloudBase 注入托管数据库/COS 与飞书凭据并完成真实环境发布验收。

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
- Python 3.12 干净 `.venv` 下 28 项测试通过、2 项 MySQL/PostgreSQL 集成测试因本地无服务跳过；飞书 H5 的 `ttfile` 文件系统转换 2 项测试和生产构建通过。
- 已用 `FileSystemManager.readFile` 替代对 `ttfile://` 的直接 fetch，并在媒体选择和分享前强制完成 JSSDK 鉴权。
- 飞书 App ID 改为由后端 challenge 在运行时返回；同一镜像无需构建参数即可切换环境。
- GitHub Actions 已替换假部署：增加后端/H5/安全审计、MySQL 8.4、PostgreSQL 16、Docker 构建、手动 CloudBase 部署及部署后验证；首次远端运行确认后端 28 项和 PostgreSQL 通过，已修复 isort 环境漂移与 MySQL 认证依赖，等待复验。
- 旧 CloudBase `/` 与 `/api/health` 已恢复快速 200；旧 `/api/analyze` 实测仍返回固定粉色裙子假结果，证明必须重新部署。

## Next Step

- 准备飞书 App ID/Secret、H5 可信域名、托管 MySQL/PostgreSQL 连接串和 COS 私有桶配置，部署本轮镜像并按 `docs/FEISHU_ROADMAP.md` 执行双账号/双端验收。
