# ADR 0001：Electron 安全边界

- 状态：已接受
- 日期：2026-08-27

## 背景

norafold 同时运行 Electron Main、Preload 和不可信程度更高的 Renderer。默认 `file://` 加载、宽泛外链匹配或通用 IPC 会扩大本地文件与系统能力的攻击面。

## 决策

- 生产 Renderer 使用标准、安全且受限的 `app://norafold` 自定义协议，只映射打包后的 Renderer 目录并阻止路径穿越。
- BrowserWindow 保持 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false` 和 `webSecurity: true`。
- Preload 只暴露冻结的最小业务 API，其类型契约放在 `src/shared`；Renderer 不直接访问 Electron 模块。
- 默认拒绝所有 Web 权限、跨源导航和新窗口。未来允许外链时使用 `URL` 精确比较协议和 origin。
- HTML 使用不允许内联脚本的 CSP，协议响应使用 `X-Frame-Options: DENY`。
- 保留 Electron 安全 Fuses，包括禁用 Node CLI inspect 参数和仅从带完整性校验的 ASAR 加载应用。

## 结果

新增桌面能力需要显式扩展 Preload/IPC 契约、安全校验和测试。Playwright 无法通过依赖 Node inspect 的 Electron 驱动启动已加固产物，因此 smoke test 使用仅在测试进程参数中启用的 Chromium CDP 端口连接 Renderer，不修改生产 Fuses。

macOS 签名、公证和权限描述不属于本决策范围，待实际能力与分发渠道明确后另建 ADR。
