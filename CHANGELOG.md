# 变更记录

本项目采用 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 结构，并使用语义化版本标签 `vX.X.X`。

## Unreleased

### Added

- Electron Forge 跨平台打包基础设施和安全 Fuses。
- 中英文国际化、语言检测和设置页语言切换。
- 设置页中的手动 GitHub Release 更新检查。
- 打包应用 Electron smoke test 与标签发布工作流。
- Electron 主进程日志、单实例控制和 Renderer 故障监控。
- Main 进程数据库生命周期、类型化文档/分块 CRUD、向量检索、迁移和备份恢复能力。

### Changed

- 主题与语言切换统一为设置页单选选项，并支持跟随系统偏好。
- 跟随系统语言时移除本地语言覆盖，恢复由浏览器语言检测器决定语言。
- 生产 Renderer 改为通过受限的 `app://norafold` 协议加载。
- TypeScript 启用严格模式与更严格的索引访问检查。
- Vite Renderer 插件改为共享配置，减少 Web 与 Electron 构建漂移。
- 增加路由错误恢复、Electron 安全边界测试、UI smoke 测试和覆盖率门槛。
- 发布矩阵收敛为 macOS arm64/x64、Windows x64 和 Linux x64；当前仍不提供平台签名、校验文件或 SBOM。
- 语言和外观选项迁移至设置页的通用标签，新增更新标签。

### Security

- 默认拒绝 Web 权限、非应用导航和新窗口请求。
- 增加严格脚本 CSP、frame 防护响应头与不可变 Preload API。
- 按审计结果为 Electron Forge 构建链传递依赖增加版本覆盖和受控例外记录。
