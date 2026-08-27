# 变更记录

本项目采用 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 结构，并使用语义化版本标签 `vX.X.X`。

## Unreleased

### Added

- Electron Forge 跨平台打包基础设施和安全 Fuses。
- 中英文国际化、语言检测和侧栏语言切换。
- 打包应用 Electron smoke test、GitHub CI 与标签发布工作流。
- Electron 主进程日志、单实例控制和 Renderer 故障监控。

### Changed

- 生产 Renderer 改为通过受限的 `app://norafold` 协议加载。
- TypeScript 启用严格模式与更严格的索引访问检查。
- Vite Renderer 插件改为共享配置，减少 Web 与 Electron 构建漂移。

### Security

- 默认拒绝 Web 权限、非应用导航和新窗口请求。
- 增加严格脚本 CSP、frame 防护响应头与不可变 Preload API。
- 修复 Electron Forge 构建链审计发现的传递依赖漏洞。
