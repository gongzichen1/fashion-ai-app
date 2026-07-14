# GitHub 优秀案例与借鉴边界

> 调研日期：2026-07-14  
> 原则：案例用于架构和评测参考，不等于允许复制代码、权重或数据进入商业产品。许可证判断以链接仓库当时的 `LICENSE`、模型卡、数据申请条款及所有依赖许可证共同为准；本文不是法律意见。

## 1. 虚拟试衣与服装数据

| 项目 | 值得借鉴 | 许可证/部署事实 | 本项目边界 |
| --- | --- | --- | --- |
| [CatVTON](https://github.com/Zheng-Chong/CatVTON) | 人像和服装双输入规范、预处理和推理服务隔离、成对/非成对评测 | 仓库说明 1024×768 的 `bf16` 推理约需 8GB VRAM；代码、checkpoint 和 demo 为 [CC BY-NC-SA 4.0](https://raw.githubusercontent.com/Zheng-Chong/CatVTON/main/LICENSE)，限非商业且衍生共享 | 一期不集成代码或权重；只参考接口、队列、GPU 服务隔离和评测维度。商业使用必须先取得单独授权并复审依赖 |
| [IDM-VTON](https://github.com/yisol/IDM-VTON) | 野外场景试衣质量、服装语义/图像提示融合、VITON-HD 和 DressCode 的评测流程 | 仓库明确代码和 checkpoint 为 [CC BY-NC-SA 4.0](https://raw.githubusercontent.com/yisol/IDM-VTON/main/LICENSE.txt) | 仅作为质量基线和离线研究候选；不得直接进入商业生产服务 |
| [OOTDiffusion](https://github.com/levihsu/OOTDiffusion) | 半身/全身模型拆分，上装、下装、连衣裙类别路由，预处理服务链 | 仓库 [LICENSE](https://raw.githubusercontent.com/levihsu/OOTDiffusion/main/LICENSE) 为 CC BY-NC-SA 4.0；运行依赖 Linux/GPU、模型权重和预处理组件 | 仅参考类别路由和独立推理服务；不与一期 Flask Web 进程共用 GPU 运行时，不复制到商业版本 |
| [DeepFashion2](https://github.com/switchablenorms/DeepFashion2) | 13 类服装、框/掩码、关键点、遮挡、尺度、视角和消费者/商店图匹配等评测维度 | 当前仓库首页未展示明确开源许可证；数据下载和图片权利还需按数据提供方条款单独确认 | 可借鉴 taxonomy 和测试集设计；未取得明确书面授权前，不把数据、标注或图片放入训练、演示或生产 |

### 虚拟试衣技术闸门

以下条件全部通过后，才可从“案例调研”进入开发：

1. 代码、权重、基础模型、数据集和预处理依赖均允许目标商业场景；
2. 单次 GPU 成本、排队延迟、峰值吞吐和故障降级达到预算；
3. 真人图片用途、保留期、删除、供应商处理和用户授权通过隐私评审；
4. 使用不同体型、肤色、遮挡、姿势和服装类别完成偏差与失败率评测；
5. 生成结果明确标识为 AI 效果示意，不能替代尺码、材质或实物承诺；
6. 推理服务作为独立受限服务部署，不把 GPU 依赖加入一期 Web API 容器。

## 2. 飞书官方案例

| 项目 | 许可证 | 推荐借鉴内容 | 注意事项 |
| --- | --- | --- | --- |
| [larksuite/lark-samples](https://github.com/larksuite/lark-samples) | Apache-2.0 | `web_app_with_auth/python`、`web_app_with_jssdk/python`、React + Node 网页应用样例；免登、JSSDK 和服务端接口组织 | 借鉴流程时保留许可证和 NOTICE 要求；示例不是生产安全基线，仍需会话、CSRF、错误和密钥加固 |
| [larksuite/node-sdk](https://github.com/larksuite/node-sdk) | MIT | token 管理、OpenAPI 调用、签名/事件处理方式 | 当前后端为 Python，不应为了 SDK 整体改写技术栈；优先使用官方 HTTP 接口或官方 Python 示例，只有新增 Node 服务时采用 |

飞书网页应用开发的最终事实来源应是开放平台文档，而不是 GitHub 示例：

- [网页应用概述](https://open.feishu.cn/document/client-docs/h5/introduction?lang=zh-CN)：H5 双端、免登、JSSDK、配置和发布流程；
- [H5 JSAPI 总览](https://open.feishu.cn/document/client-docs/h5/)：API 鉴权要求和客户端版本矩阵；
- [`chooseMedia`](https://open.feishu.cn/document/client-docs/gadget/-web-app-api/media/video/choosemedia?lang=zh-CN)：拍摄/相册选择能力；
- [如何高效配置移动端主页](https://open.feishu.cn/document/best-practices/how-to-configure-the-mobile-end-homepage?lang=zh-CN)：优先采用 `requestAccess`，避免每次打开主页都走低效重定向；
- [打开网页应用 AppLink](https://open.feishu.cn/document/common-capabilities/applink-protocol/supported-protocol/open-an-h5-app?lang=zh-CN)：工作台、独立窗口和侧边栏入口及深链参数。

## 3. 可立即吸收的设计模式

- 将客户端媒体选择封装为 adapter：飞书 `chooseMedia`、普通浏览器 `<input type=file>`、微信 `wx.chooseMedia` 分别实现，共用上传和错误模型。
- 将飞书身份交换、业务会话和业务授权分层，前端永远不持有 `app_secret`。
- 将图片存储封装为对象存储 adapter，数据库只保存对象 key、所有者、用途、保留期和引用状态。
- 将 AI 识别和未来试衣分成两个服务：一期同步识别；二期 GPU 任务使用异步队列、状态查询和取消能力。
- 评测不只看“生成好看”，还覆盖类别、遮挡、视角、颜色、材质、失败可解释性和用户数据删除。

## 4. 明确不采用

- 不直接复制任何 CC BY-NC-SA 项目的代码、checkpoint 或 demo 到可能商业化的平台；
- 不因 GitHub 仓库公开就假设 DeepFashion2 数据可商用；
- 不在一期实现生成式虚拟试衣；
- 不用多维表格保存用户原图、会话凭据或核心业务主数据；
- 不为使用 Node SDK 而重写现有 Flask 后端；
- 不把示例项目的默认配置、内存存储或调试登录直接带入生产。

当前最没有把握的是未来商业模式对“非商业”条款的具体触发边界。最大的容易遗漏项是模型仓库许可证并不自动覆盖基础模型、训练数据、人体解析器和第三方权重，技术选型时必须逐层形成许可证清单。
