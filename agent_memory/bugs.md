# Bugs And Risks

## Known Bugs

- 旧 CloudBase 线上版本的 `/api/analyze` 在 AI 未真实执行时仍返回固定粉色裙子结果；本地新代码已移除该行为，但尚未部署。
- 数据层代码已支持 MySQL/PostgreSQL，但尚未连接真实托管实例；默认 SQLite 仍不能满足 CloudBase 多实例要求。

## Risks

- 飞书 `chooseMedia` 已改用 FileSystemManager 读取 `ttfile`，但不同客户端版本的真实 ArrayBuffer 行为仍必须在移动端和桌面端实测。
- 动态 JSSDK ticket 已实现进程级缓存；多实例下会各自刷新一次，需在真实部署中监控频率限制和凭证错误率。
- COS adapter 已实现但未使用真实私有桶验证上传、鉴权代理读取、删除和权限策略。
- 托管数据库尚未验证网络白名单、TLS、连接池、备份恢复、迁移回滚和并发免登。
- 图片清理已有 CLI，最后一个收藏/衣橱引用移除也会即时删除孤儿图片；仍必须配置平台调度、全桶孤儿巡检、失败重试和账号注销流程。
- 本机没有可用 Docker 命令；根目录镜像已由 GitHub Actions 成功构建，但仍未使用生产配置启动并执行部署后验收。
- GitHub 仓库当前没有任何 Actions Secret 或 production environment；无法触发 CloudBase 生产部署。
- 真实模型视觉兼容性、延迟与错误率仍未在新部署环境验收。
- 旧上传目录包含真人图、AI 生成图、重复图和测试资产，来源授权未知；公共目录硬性保持待审核，不能因技术盘点通过而对用户发布。

## Failed Attempts

- 旧 Python 3.9 venv 的二进制依赖受 macOS 安全策略影响；已改用根目录 Python 3.12 `.venv`。
- 本机 `pip-audit` 在创建隔离临时 venv 时触发 macOS `SIGABRT`；不是依赖漏洞结论，安全审计必须以 GitHub Actions 的干净 Python 3.11 结果为准。
- 本轮无法执行 Docker 镜像构建，因为当前环境未安装 Docker CLI；需由 CI/CloudBase 构建或安装 Docker 后复验。
- 2026-07-14 再次探测旧 CloudBase `/api/health` 时 15 秒无响应；外部实例状态不稳定，不能作为本轮新版本的部署证据。
- 随后旧 CloudBase health 恢复 200，但只返回旧版简单状态，新增 `/api/live` 为 404；确认线上尚未部署本分支，间歇性可达不改变发布阻塞结论。
- 部署验证曾要求 health 的 `ready` 布尔字段，但接口未返回该字段，导致正常部署也会被误判失败；已修复接口契约并新增回归测试。
- 首次远端 CI 的 28 项后端测试和 PostgreSQL 集成测试通过；随后因 `isort` first-party 分类随环境漂移、MySQL 8.4 `caching_sha2_password` 缺少 `cryptography` 而失败。两项均已修复，第二次 CI 的 verify、PostgreSQL/MySQL 和 Docker 构建全部通过。

## Follow-Up

- 发布前必须完成外部数据库、真实 COS、飞书双端、双账号隔离、真实 AI、删除传播和容器重启验收；任一 P0 失败即停止发布。
