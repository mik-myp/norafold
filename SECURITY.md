# 安全策略

## 支持范围

项目仍处于早期迭代阶段，只为最新默认分支和最新 GitHub Release 提供安全修复。历史版本不承诺回溯修复。

## 报告漏洞

请通过 GitHub 仓库的 **Security > Report a vulnerability** 私密安全公告提交报告，不要公开创建 Issue。报告应包含受影响版本、复现步骤、影响范围和可行的缓解方案。

维护者会尽快确认报告并评估严重度。在修复发布前，请避免公开复现细节。仓库没有配置 macOS/Windows 签名、公证或附加校验产物，因此相关缺失属于已知发布限制；Electron 沙箱、权限、导航、CSP、协议处理或 IPC 边界的绕过仍属于有效安全问题。

## 依赖安全

依赖更新使用 pnpm/Vite+，并检查 `pnpm audit --prod`、`pnpm audit` 和 `pnpm audit signatures`。`pnpm-workspace.yaml` 中的安全 override 属于受审计配置，修改前必须说明原因并完成 Electron package、make 与 smoke test。
