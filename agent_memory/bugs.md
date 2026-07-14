# Bugs And Risks

## Known Bugs

- 旧 CloudBase 线上版本的 `/api/analyze` 在 AI 未真实执行时仍返回固定粉色裙子结果；本地新代码已移除该行为，但尚未部署。
- 数据层代码已支持 MySQL/PostgreSQL，但尚未连接真实托管实例；默认 SQLite 仍不能满足 CloudBase 多实例要求。

## Risks

- 飞书 `chooseMedia` 返回的客户端临时 URI 是否可由当前前端读取，必须在移动端和桌面端实测。
- 飞书 JSSDK ticket 当前通过环境变量注入，生产需补齐 ticket 获取、缓存和刷新机制。
- COS adapter 已实现但未使用真实私有桶验证上传、鉴权代理读取、删除和权限策略。
- 托管数据库尚未验证网络白名单、TLS、连接池、备份恢复、迁移回滚和并发免登。
- 图片清理已有 CLI，但必须配置平台调度；仍需孤儿巡检、失败重试和账号注销流程。
- 本机没有可用 Docker 命令，根目录镜像尚未本地构建验证。
- 真实模型视觉兼容性、延迟与错误率仍未在新部署环境验收。

## Failed Attempts

- 旧 Python 3.9 venv 的二进制依赖受 macOS 安全策略影响；已改用根目录 Python 3.12 `.venv`。
- 本轮无法执行 Docker 镜像构建，因为当前环境未安装 Docker CLI；需由 CI/CloudBase 构建或安装 Docker 后复验。

## Follow-Up

- 发布前必须完成外部数据库、真实 COS、飞书双端、双账号隔离、真实 AI、删除传播和容器重启验收；任一 P0 失败即停止发布。
