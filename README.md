# norafold

norafold 是基于 Electron Forge、React、TypeScript 和 Vite+ 构建的跨平台桌面应用。当前仓库包含桌面运行壳、文件路由、主题切换、中英文国际化和手动更新检查基础设施，业务页面仍处于迭代阶段。

## 环境要求

- Node.js `24.20.0`
- pnpm `11.23.0`
- Vite+ 全局 CLI `vp`

运行 `vp install` 会按 `package.json#devEngines` 准备固定工具版本并安装依赖。项目只使用 Vite+、Oxfmt 和 Oxlint，不使用 Prettier。

## 常用命令

| 命令                     | 用途                                                    |
| ------------------------ | ------------------------------------------------------- |
| `vp install`             | 安装依赖并刷新 Vite+ Git Hooks                          |
| `vp run start`           | 启动 Electron 开发环境                                  |
| `vp run ci`              | 执行格式、Lint、类型、i18n、单测、覆盖率和 Web 构建检查 |
| `vp test run --coverage` | 单独执行单测并检查覆盖率门槛                            |
| `vp run package`         | 生成当前平台的未分发 Electron 应用                      |
| `vp run test:e2e`        | 对 `vp run package` 的产物执行 Electron smoke test      |
| `vp run make`            | 生成当前平台的可发布安装包或压缩包                      |
| `vp run i18n:extract`    | 提取并整理翻译 key                                      |

完整的本地桌面验证顺序：

```sh
vp run ci
vp run package
vp run test:e2e
vp run make
```

## 目录结构

```text
electron/                 Electron Main 与 Preload
electron/database/        数据库驱动、迁移、生命周期和公开 CRUD API
src/components/           应用布局和通用 UI
src/features/             按领域组织的业务功能
src/i18n/                 i18next 初始化、类型和翻译资源
src/routes/               TanStack Router 文件路由
src/shared/               Main、Preload、Renderer 共用契约
tests/e2e/                打包应用的 Electron smoke test
 .github/workflows/        标签发布工作流
```

生产 Renderer 通过受限的 `app://norafold` 自定义协议加载。Electron 默认拒绝未声明的权限、跨源导航和新窗口；Renderer 不直接获得 Node.js 能力。新增桌面能力前请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 和 [docs/adr/0001-electron-security-boundary.md](./docs/adr/0001-electron-security-boundary.md)。

在设置页的“更新”标签中，用户可以手动检查 GitHub Release。发现新版本后，确认即可打开固定的 Release 下载页面；当前不会后台静默下载或安装更新。

数据库已在 Main 进程中提供唯一实例、类型化 CRUD、迁移、向量检索和备份恢复能力；使用方式见 [数据库使用说明](./docs/database.md)。

## 发布

推送严格符合 `vX.X.X` 的标签会触发 GitHub Actions，在 macOS arm64/x64、Windows x64 和 Linux x64 原生 Runner 上执行 `vp run make`，然后创建 GitHub Release。当前未配置 push/PR 的长期 CI；发布工作流会在构建前执行完整验证：

```sh
git tag v0.1.0
git push origin v0.1.0
```

工作流会从标签临时写入 Electron 包版本。当前发布不包含 macOS/Windows 代码签名、公证、checksums 或 SBOM，应用图标暂时使用 Electron 默认资源；用户自行判断下载来源并决定是否安装。

## 安全

请不要在公开 Issue 中披露未修复漏洞。报告方式和响应边界见 [SECURITY.md](./SECURITY.md)。
