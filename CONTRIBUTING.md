# 参与开发

## 开始之前

1. 拉取最新代码后运行 `vp install`。
2. 阅读根目录 `AGENTS.md`，确认 Vite+、Electron、路由、国际化和提交规范。
3. 从范围清晰的分支开始修改，不手工编辑 `src/routeTree.gen.ts`。

## 开发要求

- 只使用 pnpm/Vite+ 管理依赖与任务，不引入 npm、yarn 或 Prettier 工作流。
- Renderer 不得直接导入 Node.js 或 Electron Main API。需要桌面能力时，在 `src/shared` 定义最小类型契约，由 Preload 通过 `contextBridge` 暴露。
- 新增 IPC 必须限制 channel、校验参数并验证发送方来源；禁止暴露通用 `send`、`invoke` 或 Electron 对象。
- 所有可翻译业务文案使用 i18next key，并同步维护中文和英文资源。
- 行为变化应增加与风险相称的单测；涉及桌面启动、安全策略或 Preload 契约时更新 Electron smoke test。

## 提交前检查

```sh
vp run ci
vp run package
vp run test:e2e
```

影响 Forge maker、Fuses、原生依赖或发布流程时，还必须运行 `vp run make`。提交 Hook 会先格式化暂存文件，再执行格式和代码检查；不要跳过 Hook 来隐藏失败。

## Pull Request

PR 描述应包含变更目的、用户可见行为、验证命令和已知限制。安全边界、依赖 override、构建链或架构方向发生变化时，应新增或更新 `docs/adr` 下的架构决策记录，并同步更新 `CHANGELOG.md` 的 `Unreleased` 部分。
