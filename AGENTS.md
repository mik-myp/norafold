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

## 实现前的库与方案复用

- 修改代码前先检查 `package.json`、现有组件、工具函数和项目配置，并查阅相关框架或依赖的官方文档，确认是否已有可直接适配的能力。
- 主题、国际化、路由、状态、表单、日期、存储和平台检测等通用能力优先使用项目已安装的成熟库及其公开 API，不重复手写同类基础设施。
- 现有依赖无法满足需求时，先评估生态中维护活跃、类型完整且与当前技术栈兼容的方案；确认没有合适实现后才编写自定义逻辑，并说明原因、边界和测试策略。
- 不为单一调用增加功能重叠的依赖；新增依赖前同时检查现有依赖、包体积、维护状态、许可证、peer dependencies 和安全审计结果。

## 抽象、拆分与复用

- 默认保持代码就近、直接和可读，不为单次使用的简单表达式、短小 JSX 提前创建变量、函数、Hook、组件或通用工具。
- 抽离应解决明确问题，例如重复实现、复杂分支、独立状态或副作用、可独立测试的业务规则以及清晰的领域边界；不因文件行数、视觉分组或“以后可能复用”而拆分。
- 相同代码出现两次时先观察差异，出现三次及以上且语义稳定后再考虑公共抽象。“三次原则”是参考而非硬性门槛；安全校验、业务不变量和复杂算法等高风险逻辑即使只使用一次，也可以为了隔离和测试而抽离。
- 不通过多个布尔参数让一个组件承担差异明显的职责；分支持续增长或调用方需要理解内部模式时，应拆成职责明确的组件或组合接口。
- 抽象必须减少调用方需要理解的细节；如果抽离后参数更多、跳转更多，或命名无法准确表达领域含义，应保留就近实现。

## React 状态、副作用与 Compiler

- 能在渲染阶段从 props、state、路由或其他已有数据计算出的值，不重复存入 state，也不通过 Effect 同步。
- Effect 只用于与 React 外部系统同步，并正确清理订阅、定时器、监听器和异步任务。
- 状态放在最靠近使用者的位置；只有多个独立组件确实共享时才提升状态或引入 Context。
- 项目已启用 React Compiler，默认由 Compiler 处理组件、Hook 和表达式的记忆化，不为普通局部计算或事件处理器主动添加 `useMemo`、`useCallback` 或 `memo`。
- 只有第三方 API 明确要求稳定引用、Compiler 无法覆盖，或性能测量证明存在瓶颈时，才使用手工记忆化，并在代码中说明原因。
- 不依赖 React Compiler 修正错误的数据流、缺失的 Effect 依赖、可变状态或渲染期间的副作用；组件和 Hook 必须独立遵守 Rules of React。
- 自定义 Hook 应封装完整且可命名的行为，不只是为了缩短组件而机械搬运 Hook 调用。

## 模块边界与依赖方向

- 路由文件负责页面入口和路由边界，业务逻辑放入 `src/features/<domain>`；通用且不包含领域含义的能力才放入 `src/lib`、`src/hooks` 或 `src/shared`。
- feature 可以依赖 `src/components/ui`、`src/hooks`、`src/lib` 和 `src/shared`，通用层不得反向依赖具体 feature。
- 不创建职责模糊的 `utils.ts`、`helpers.ts` 或大型公共导出文件；文件名应表达具体业务或能力。现有 `src/lib/utils.ts` 仅保留设计系统通用的 `cn()`。
- 跨 feature 共享逻辑前先确认其是否已经形成稳定的公共概念，不通过深层相对路径绕过模块公开边界，也不得引入循环依赖。

## 类型与数据边界

- IPC、持久化数据、URL 参数和第三方返回值等外部输入必须在进入业务层时完成校验与类型收窄，业务内部使用已经验证的类型。
- 避免使用类型断言、非空断言或双重断言绕过校验；确需使用时应限制在数据边界，并说明类型系统无法推导的原因。用于保留字面量类型的 `as const` 和用于静态契约检查的 `satisfies` 不属于此类规避。
- 有限状态优先使用判别联合，避免多个布尔值组合出非法状态。
- 不为每个局部对象机械创建 `interface`；只有类型需要复用、导出或表达稳定契约时才抽离命名类型。
- 不使用 `any` 绕过类型检查；未知外部数据先使用 `unknown`，再经过校验或收窄后使用。

## 错误处理与用户反馈

- 不吞掉异常；能够恢复时转换为明确结果或提供用户反馈，不能恢复时记录必要上下文并交给统一错误边界处理。
- 不使用空 `catch`，也不捕获当前层无法处理的错误。清理失败等确需忽略的异常必须说明原因和影响范围。
- 用户可见错误使用国际化文案和现有反馈组件；日志保留排查所需的技术上下文，但不得包含密钥、令牌或完整用户内容。
- Renderer 不使用 `console.*` 代替正式日志、错误反馈或 Electron 主进程日志。

## 测试设计与性能优化

- 测试公共行为、状态转换和边界条件，不依赖私有函数、内部 Hook、实现细节或脆弱的 DOM 层级。
- 修复缺陷时优先增加能够复现问题的测试，再修复实现，确保测试能够防止同类回归。
- 不提前引入缓存、虚拟列表、懒加载或并发优化；先通过测量确认瓶颈，优化前后记录可比较指标。
- 不用明显增加实现和维护复杂度的方式换取无法验证的性能收益；删除优化时也应确认其不再承担稳定引用或第三方契约。

## 命名、注释与生成代码

- 名称应表达领域含义和职责；布尔值使用 `is`、`has`、`can`、`should` 等前缀，事件处理函数使用 `handleXxx`。
- 注释解释原因、约束和不明显的取舍，不复述代码行为；过时注释与代码修改同时清理。
- 不机械抽离魔法数字或字符串；只有值具有业务含义、需要统一调整或用于协议契约时才定义命名常量。
- `src/components/ui` 只存放设计系统基础组件，业务组件不得放入该目录；更新 shadcn 生成代码时避免顺手重构无关文件。
- 自动生成文件不得手工修改；生成命令、忽略格式化的范围及是否需要提交，以对应工具和项目既有配置为准。

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

- 提交或交付前运行 `vp run ci`；需要分别排查时依次运行 `vp check`、`vp test run --coverage` 和 `vp run build`。
- Vitest 测试文件使用 `*.test.ts(x)` 或 `*.spec.ts(x)` 命名，并与被测模块保持清晰的目录关系。
- 测试 API 从 `vite-plus/test` 导入；测试范围由 `vite.config.ts` 的 `test` 配置统一管理，不另建 `vitest.config.ts`。
- 新增非简单业务逻辑、状态转换、数据处理或交互行为时，应同步增加测试；不要把编译通过当作行为正确的替代。
- 如果检查失败，交付说明中写明失败命令、文件和原因；不要为了通过检查而忽略警告或盲目使用自动修复。

## Git Hooks 与 CI

- Vite+ Git Hook 由 `vp hooks` 管理，项目 Hook 位于 `.vite-hooks`；安装依赖时通过 `prepare` 脚本执行 `vp config --no-agent`，自动安装或刷新 dispatcher。
- pre-commit Hook 只调用 `vp staged`，暂存文件规则统一维护在 `vite.config.ts#staged`。
- 提交时必须严格按顺序执行：先运行 `vp fmt --write` 格式化暂存文件，再运行 `vp fmt --check` 验证格式；暂存内容包含 JavaScript/TypeScript 文件时，随后运行 `vp check --no-fmt` 完成 Lint 和类型检查。不要把检查放在格式化之前，也不要并行执行这些步骤。
- `src/routeTree.gen.ts` 是自动生成文件，staged 流程必须排除它，不能由 Hook 格式化或修复。
- GitHub Actions 发布工作流位于 `.github/workflows/release.yml`，使用固定版本的 Vite+ Setup Action、Node.js 和锁文件安装，并通过 `vp run ci` 执行发布前完整验证；项目不配置 push/PR 的长期 CI 工作流。

## Electron 进程边界与安全

- Electron Main、Preload 和 Renderer 必须保持清晰边界。Renderer 不得导入 Node.js 或 Electron 模块；跨进程共用的最小类型契约放在 `src/shared`，浏览器全局声明放在 `src/types`。
- BrowserWindow 必须保持 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false` 和 `webSecurity: true`。不得为了开发或测试关闭安全 Fuses、沙箱、Web 安全或证书校验。
- 生产 Renderer 只通过 `app://norafold` 协议加载。协议处理必须限制 host、HTTP method 和 Renderer 根目录，解码路径后阻止目录穿越；不得恢复为 `file://`。
- Web 权限默认拒绝。新增摄像头、麦克风、定位、通知等能力时，必须按明确业务场景同时增加 request/check handler、来源校验、测试和安全说明；macOS plist 权限描述在功能实际使用前保持默认值。
- `will-navigate` 和新窗口默认拒绝。确需打开外链时使用 `new URL()` 后精确校验协议、host/origin，再调用 `shell.openExternal`；禁止使用 `startsWith`、正则前缀或用户输入直接打开。
- CSP 必须保持 `script-src 'self'`，不得增加 `unsafe-inline` 或 `unsafe-eval`。确需内联样式的组件只能使用 `style-src` 现有例外；frame 防护由自定义协议响应头提供。
- Preload 暴露对象必须最小化并冻结。新增 IPC 时逐 channel 定义参数和返回类型，校验输入以及 `event.senderFrame` 来源；禁止暴露通用 `ipcRenderer.send/invoke/on`、Electron 对象或任意文件系统能力。
- GitHub Release 更新检查只能由 Main 进程访问固定 API，Preload 仅暴露版本、检查结果和打开固定 Release 页面的方法；Renderer 不得请求更新 API、执行安装包或打开用户提供的外部 URL。
- 主进程与窗口故障统一记录到 `electron-log`。新增关键后台任务时覆盖未捕获异常、拒绝、加载失败和进程退出路径，不在日志中写入密钥、令牌或完整用户内容。
- 当前发布明确不处理 macOS/Windows 代码签名、公证和附加校验产物；默认使用 Electron 图标，并在 Forge 配置中保留 TODO。除非任务明确要求，不添加临时证书、平台凭据或绕过系统安全提示的脚本。

## 数据库模块与持久化

- 数据库代码统一维护在 `electron/database`，`index.ts` 是 Main 进程唯一公开入口；业务模块不得深层导入 `driver.ts`、`migrations.ts` 或直接持有 `DatabaseSync`。
- 应用生命周期通过 `initializeDatabase()`、`getDatabase()` 和 `closeDatabase()` 管理唯一连接。业务模块使用 `getDatabase()` 调用类型化 API，不自行打开连接或执行 SQL。
- 文档、分块、embedding 等持久化操作通过领域 CRUD API 完成；不暴露通用 SQL、数据库路径、句柄或任意文件系统能力给 Preload 和 Renderer。
- schema 变化必须追加版本化迁移并同步更新 `currentDatabaseSchemaVersion`、数据库测试、`docs/database.md` 和相关 ADR；不得修改已经发布的迁移语义。
- 跨表写入、替换和级联清理必须使用事务。外部输入在数据库边界校验，查询结果在返回业务层前完成运行时类型收窄。
- 备份使用 Node SQLite Backup API，恢复前关闭目标连接；不得通过复制活动数据库及 WAL 文件实现备份。数据库改动必须覆盖 CRUD、迁移幂等、维度不匹配、关联清理和备份恢复测试。

## Electron 测试与打包

- Web 逻辑先使用 Vitest 单测，完整验证使用 `vp test run --coverage` 并满足 `vite.config.ts#test.coverage.thresholds`。涉及 Main、Preload、CSP、自定义协议、Fuses 或桌面启动行为时，必须更新 `tests/e2e` 中的打包应用 smoke test。
- Electron E2E 的固定顺序是先运行 `vp run package`，再运行 `vp run test:e2e`。测试必须针对 `out` 下真实产物，不以 Vite 开发服务器通过代替打包验证。
- 安全 Fuses 禁用了 Node CLI inspect 参数，因此不得改用 Playwright `_electron.launch` 并放松 Fuses；当前 smoke test 通过测试启动参数开启 Chromium CDP，仅检查 Renderer。
- 修改 Forge maker、Fuses、安全 override、原生依赖或发布工作流后，还必须在当前平台运行 `vp run make`。
- Electron Forge Vite 插件当前会输出 `inlineDynamicImports` 上游弃用警告。不得修改 `node_modules` 或屏蔽警告；升级 Forge 后重新验证，待上游修复后移除本说明。

## 供应链与依赖审计

- 完整交付除 `vp run ci` 外还应运行 `pnpm peers check`、`pnpm audit --prod`、`pnpm audit` 和 `pnpm audit signatures`。生产审计不得遗留已知漏洞，完整审计不得遗留未记录的漏洞，registry 包签名验证必须通过。
- `pnpm-workspace.yaml#auditConfig.ignoreGhsas` 仅允许记录尚无修复版本、不会进入生产运行时且攻击面已明确受限的构建期漏洞；每项必须注明依赖路径、影响范围、临时缓解措施和解除条件。新增忽略项需要安全评估，依赖升级时必须重新核对并在上游修复后立即移除。
- `pnpm-workspace.yaml#overrides` 中的 `tar`、`tmp` 和 `extract-zip` 用于修复 Electron Forge 构建链漏洞；`extract-zip` 映射到 Electron 官方维护的兼容实现。变更或移除 override 前必须核对上游修复状态，并完成三平台 CI 或等价验证。
- Forge 当前包含 Git 来源的构建期子依赖，因此项目显式设置 `blockExoticSubdeps: false`。这是受控供应链例外，不得扩展为跳过 lockfile、签名、脚本或审计检查。
- 不裁剪现有未使用的 shadcn 组件和依赖，除非任务明确授权；但新增依赖必须说明用途、检查 peer dependencies，并确保 `package.json` 与 `pnpm-lock.yaml` 同步。
- 项目格式化只使用 Vite+/Oxfmt。不得添加 Prettier 依赖、配置、编辑器 formatter 或 CI 步骤。

## GitHub 发布与版本

- `.github/workflows/release.yml` 只接受严格符合 `vX.X.X` 的标签，并在 macOS（arm64、x64）、Windows（x64）和 Linux（x64）原生 Runner 上执行 `vp run make`。不得使用模糊标签、分支名或手工上传替代可追溯发布。
- Release 版本从标签临时写入 CI 工作区的 `package.json`；不要为了发布手工提交版本改动，也不要把 shell 文本替换用于 JSON。
- GitHub Actions 必须固定到完整 Commit SHA，并在行尾注明对应版本。升级 Action 时同时核对来源、权限和 SHA，不使用浮动的 `main`、`latest` 或主版本标签。
- 构建 job 只授予 `contents: read`，最终发布 job 才授予 `contents: write`。新增 secrets 时遵循最小权限，禁止通过 PR 日志或构建产物泄露。
- 发布前更新 `CHANGELOG.md`，并保证 `vp run ci`、Electron smoke test、三平台 maker 全部通过。当前产物不包含 macOS/Windows 签名、公证、checksums 或 SBOM，应在发布说明中保留这一限制。

## 工程文档与架构决策

- 开发命令、目录或发布流程变化时同步更新 `README.md` 和 `CONTRIBUTING.md`；安全支持范围变化时更新 `SECURITY.md`。
- 安全边界、IPC 模型、持久化方案、自动更新、签名/公证或关键构建架构发生变化时，在 `docs/adr` 新增或更新 ADR，记录背景、决策和后果。
- 用户可见或运维相关的变化维护在 `CHANGELOG.md#Unreleased`。不要把预留页面或尚未实现的产品功能描述为已交付能力。
