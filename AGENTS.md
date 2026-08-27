<!--VITE PLUS START-->

# 使用 Vite+ 统一 Web 工具链

本项目使用 Vite+。它建立在 Vite、Rolldown、Vitest、tsdown、Oxlint、Oxfmt 和 Vite Task 之上，为运行时管理、依赖管理和前端工具提供统一的全局 CLI：`vp`。Vite+ 与 Vite 不同，它通过 `vp dev` 和 `vp build` 调用 Vite。使用 `vp help` 查看命令列表，使用 `vp <command> --help` 查看具体命令的帮助。

Vite+ 文档位于 `node_modules/vite-plus/docs`，也可以查看在线文档：https://viteplus.dev/guide/。

## 内置命令与项目脚本

`vp <name>` 执行 Vite+ 内置命令；`vp run <name>` 执行 `package.json` 脚本或 `vite.config.ts` 中定义的任务。项目脚本不能覆盖内置命令，因此 `vp dev` 与 `vp run dev` 可能代表不同的执行路径。执行前先检查 `package.json` 和 `vite.config.ts`；需要运行项目脚本或任务时使用 `vp run <name>`。

## 工具版本

使用 `vp toolchain` 查看当前 Vite+ 版本及其工具关系。也可以指定工具名称，例如 `vp toolchain vite`。使用 `vp toolchain --global` 忽略本地 `vite-plus` 包。使用 `vp why <package>` 查看包管理器的依赖关系。

## 审查清单

- [ ] 拉取远程变更后、开始工作前运行 `vp install`。
- [ ] 修改完成后运行 `vp check` 和 `vp test`，完成格式化、Lint、类型检查和测试。
- [ ] 检查 `vite.config.ts` 和 `package.json` 是否定义了需要额外执行的任务或脚本，并通过 `vp run <script>` 运行。
- [ ] 如果安装、运行时或包管理行为异常，运行 `vp env doctor`，向他人求助时附上诊断输出。

<!--VITE PLUS END-->

# 项目级开发规范

## 包管理与依赖

- 项目使用 pnpm，依赖版本和解析结果由 `pnpm-lock.yaml` 管理；不要混用 npm 或 yarn 修改依赖。
- Node.js 固定为 `24.20.0`，pnpm 固定为 `11.23.0`，二者均在 `package.json#devEngines` 中声明；升级版本时同步更新 CI 配置并运行 `vp env doctor`。
- 安装依赖、同步锁文件优先使用 `vp install`。新增或移除依赖后检查 `package.json` 与 `pnpm-lock.yaml` 是否同时更新。
- `package.json` 脚本和 `vite.config.ts` 任务统一通过 `vp run <name>` 执行。完整构建使用 `vp run build`，该 Vite Task 包含 TypeScript 构建检查和 `vp build`。
- Vite Task 已对项目脚本和配置任务启用缓存；完整本地/CI 验证使用 `vp run ci`，依次执行检查、测试和构建。
- 修改依赖或工具链配置后，必要时运行 `vp toolchain`、`vp why <package>` 和 `vp env doctor` 进行核对。

## TypeScript 与代码格式

- 源码跨目录导入优先使用 `@/` 别名（指向 `src`）；同目录文件、入口文件和样式文件可以使用相对路径。
- 类型只在类型位置使用 `import type` 导入。
- 遵守当前 TypeScript 配置：不得留下未使用的局部变量或参数，不引入无法擦除的 TypeScript 运行时语法，避免 `switch` 分支贯穿。
- JavaScript、TypeScript、JSX 和 TSX 使用 Oxfmt/Oxlint 格式化和检查，不手工维护与工具冲突的格式。
- 保持双引号、分号和现有导入、换行风格。Tailwind 类名排序由 `vite.config.ts` 中的 Oxfmt 配置负责，修改后通过 `vp check` 验证。

## TanStack Router 与路由文件

- 新增页面在 `src/routes` 下使用文件路由，并通过 `createFileRoute(...)` 声明；根路由使用 `createRootRoute(...)`。
- 页面间导航使用 TanStack Router 的类型安全 `Link` 和 Router API，不使用 `href="#"` 或手写路由状态。
- 导航激活状态通过 `useMatchRoute` 等 Router API 根据当前 URL 计算，不在侧栏或页面中复制一套路由状态。
- `src/routeTree.gen.ts` 是 TanStack Router 自动生成文件，禁止手工修改或格式化。新增或调整路由后让插件重新生成它。

## shadcn、Base UI 与组件复用

- 项目使用 shadcn `base-nova` 风格、Base UI 基础组件、Tailwind CSS v4 和 Lucide 图标；组件别名以 `components.json` 为准。
- 优先复用 `src/components/ui` 中已有组件和组合方式，不重复实现按钮、弹窗、表单、提示、导航等基础能力。
- 添加 shadcn 组件前先确认项目上下文和已安装组件；使用 `pnpm dlx shadcn@latest`，并在添加或更新后阅读生成文件，检查导入和组件组合。
- 更新已有组件时先使用 CLI 的预览和差异选项；没有明确授权时不要使用覆盖本地修改的操作。
- Base UI 自定义触发器使用组件支持的 `render` 方式，不直接套用 Radix 专用的 `asChild` API。
- 组件组合应保持可访问性：弹窗、侧滑面板和抽屉必须提供标题；`TabsTrigger` 放在 `TabsList` 中；菜单项放在对应的 Group 中；头像提供 `AvatarFallback`。
- 业务组件中的条件类名统一使用 `cn()`；图标统一从 `lucide-react` 导入。按钮中的图标遵循组件的 `data-icon` 约定，不额外覆盖组件负责的图标尺寸。

## Tailwind、主题与局部样式

- 项目使用 Tailwind CSS v4，不维护传统 `tailwind.config.js`。全局主题变量、字体、暗色模式和 Tailwind 主题映射统一维护在 `src/index.css`。
- 颜色优先使用语义变量和现有组件变体，例如 `bg-background`、`text-muted-foreground`、`bg-primary`；业务代码避免硬编码颜色值。
- 布局间距优先使用 Flex/Grid 与 `gap-*`，不使用 `space-x-*` 或 `space-y-*` 代替布局；等宽高元素优先使用 `size-*`；文本截断使用 `truncate`。
- 不为已有主题手工添加成套的 `dark:` 颜色覆盖；叠层组件不手工添加 z-index，除非有明确的组件级需求。
- 页面和业务组件优先使用 Tailwind。只有复杂的局部交互样式、动画或第三方组件覆盖才使用 CSS Module/Less；样式文件应与组件同目录，避免新增平行的全局样式入口。
- 新增视觉样式需同时检查浅色、深色和移动端表现，并尊重 `prefers-reduced-motion`。

## 布局、侧栏与响应式行为

- 当前应用壳由 `src/components/layouts/app-shell.tsx` 负责，侧栏由 `app-sidebar.tsx` 和 `nav-main.tsx` 负责；新增导航项优先通过导航数据传入 `NavMain`。
- 主侧栏保持 `collapsible="icon"` 的桌面折叠模式；折叠后每个入口仍必须有 tooltip。
- 移动端使用现有 Sidebar/Sheet 行为，点击路由后关闭移动端抽屉；不要为了桌面布局牺牲小屏可用性。
- 侧栏只负责导航、布局和选择，不直接读写业务数据、数据库或实现领域逻辑。
- 主内容区应尽量保留连续可用空间；只有确实需要内容框架时才引入 inset 卡片式布局。

## 国际化与翻译资源

- 项目使用 i18next、react-i18next 和 `i18next-browser-languagedetector`；初始化统一维护在 `src/i18n/index.ts`，不要在组件中重复创建实例或手写浏览器语言、缓存读取和语言映射逻辑。
- 支持的语言统一维护在 `supportedLanguages`。语言检测按本地缓存、浏览器语言的顺序执行，缓存键为 `norafold.language`；切换语言使用 `i18n.changeLanguage(...)`。
- 翻译资源采用 `src/i18n/locales/<locale>/<namespace>.json` 目录结构，当前默认 namespace 为 `translation`。新增语言或 namespace 时同步更新 `i18next.config.ts`、`project.inlang/settings.json` 和运行时 resources。
- 业务文案使用 `t(...)` 或 react-i18next 提供的组件，不在 JSX 中新增可翻译的硬编码文案；品牌名、代码片段等无需翻译的内容使用 i18next CLI 支持的精确忽略注释，并注明原因。
- 使用 `vp run i18n:extract` 提取并整理 key，使用 `vp run i18n:types` 更新类型；`src/i18n/i18next.d.ts` 与 `src/i18n/resources.d.ts` 是生成文件，不手工维护资源类型。
- 编辑器内翻译预览使用 Sherlock（Inlang VS Code 扩展），项目配置位于 `project.inlang/settings.json`；不要再添加 i18n Ally 专用配置。
- 提交前运行 `vp run i18n:check`，确认提取结果无漂移、所有语言翻译完整且源码不存在未处理的硬编码文案；完整验证仍使用 `vp run ci`。

## 测试、检查与交付

- 提交或交付前运行 `vp run ci`；需要分别排查时依次运行 `vp check`、`vp test` 和 `vp run build`。
- Vitest 测试文件使用 `*.test.ts(x)` 或 `*.spec.ts(x)` 命名，并与被测模块保持清晰的目录关系。
- 测试 API 从 `vite-plus/test` 导入；测试范围由 `vite.config.ts` 的 `test` 配置统一管理，不另建 `vitest.config.ts`。
- 新增非简单业务逻辑、状态转换、数据处理或交互行为时，应同步增加测试；不要把编译通过当作行为正确的替代。
- 如果检查失败，交付说明中写明失败命令、文件和原因；不要为了通过检查而忽略警告或盲目使用自动修复。

## Git Hooks 与 CI

- Vite+ Git Hook 由 `vp hooks` 管理，项目 Hook 位于 `.vite-hooks`；安装依赖时通过 `prepare` 脚本执行 `vp config --no-agent`，自动安装或刷新 dispatcher。
- pre-commit Hook 只调用 `vp staged`，暂存文件规则统一维护在 `vite.config.ts#staged`。
- 提交时必须严格按顺序执行：先运行 `vp fmt --write` 格式化暂存文件，再运行 `vp fmt --check` 验证格式；暂存内容包含 JavaScript/TypeScript 文件时，随后运行 `vp check --no-fmt` 完成 Lint 和类型检查。不要把检查放在格式化之前，也不要并行执行这些步骤。
- `src/routeTree.gen.ts` 是自动生成文件，staged 流程必须排除它，不能由 Hook 格式化或修复。
- GitHub Actions 工作流位于 `.github/workflows/ci.yml`，使用固定版本的 Vite+ Setup Action、Node.js 和锁文件安装，并通过 `vp run ci` 执行完整验证。
