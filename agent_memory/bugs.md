# Bugs And Risks

## Known Bugs

- 旧 CloudBase 线上版本的 `/api/analyze` 在 AI 未真实执行时仍返回固定粉色裙子结果；本地新代码已移除该行为，但尚未部署。
- 数据层代码已支持 MySQL/PostgreSQL，但尚未连接真实托管实例；默认 SQLite 仍不能满足 CloudBase 多实例要求。

## Risks

- 飞书 `chooseMedia` 已改用 FileSystemManager 读取 `ttfile`，但不同客户端版本的真实 ArrayBuffer 行为仍必须在移动端和桌面端实测。
- 动态 JSSDK ticket 已实现进程级缓存；多实例下会各自刷新一次，需在真实部署中监控频率限制和凭证错误率。
- COS adapter 已实现但未使用真实私有桶验证上传、鉴权代理读取、删除和权限策略。
- 托管数据库尚未验证网络白名单、TLS、连接池、备份恢复、迁移回滚和并发免登。
- 图片清理已有 CLI，但必须配置平台调度；仍需孤儿巡检、失败重试和账号注销流程。
- 本机没有可用 Docker 命令，根目录镜像尚未本地构建验证。
- GitHub Actions 已配置 Docker 和两种托管数据库测试，但当前提交尚未推送，不能把配置存在当成远端通过。
- 真实模型视觉兼容性、延迟与错误率仍未在新部署环境验收。

## Failed Attempts

- 旧 Python 3.9 venv 的二进制依赖受 macOS 安全策略影响；已改用根目录 Python 3.12 `.venv`。
- 本机 `pip-audit` 在创建隔离临时 venv 时触发 macOS `SIGABRT`；不是依赖漏洞结论，安全审计必须以 GitHub Actions 的干净 Python 3.11 结果为准。
- 本轮无法执行 Docker 镜像构建，因为当前环境未安装 Docker CLI；需由 CI/CloudBase 构建或安装 Docker 后复验。
- 首次远端 CI 的 28 项后端测试和 PostgreSQL 集成测试通过；随后因 `isort` first-party 分类随环境漂移、MySQL 8.4 `caching_sha2_password` 缺少 `cryptography` 而失败，已定位并修复，等待第二次 CI 复验。

## Follow-Up

- 发布前必须完成外部数据库、真实 COS、飞书双端、双账号隔离、真实 AI、删除传播和容器重启验收；任一 P0 失败即停止发布。
