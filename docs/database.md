# 数据库使用说明

Norafold 使用 Electron Main 进程中的 Node `node:sqlite` 和 `sqlite-vec`，为离线文档元数据、分块和本地向量检索提供基础设施。数据库默认位于 Electron `app.getPath("userData")` 下的 `norafold.sqlite`。

## 调用边界

数据库只能由 Main 进程调用，`electron/database/index.ts` 是唯一公开入口。Renderer 不得导入 Node.js、执行 SQL 或接收数据库句柄；需要界面能力时，应新增参数和返回值明确的 IPC channel，并在 Main 中完成输入校验。

应用启动时已经初始化唯一数据库实例，Main 进程的功能模块可以直接取得实例：

```ts
import { getDatabase } from "../database/index.js";

const database = getDatabase();
const documents = database.listDocuments({ limit: 50, offset: 0 });
```

不要在功能模块中再次调用 `openDatabase()`。该函数只用于应用生命周期、独立脚本和测试。

## CRUD API

| 领域 | 创建                                           | 查询                                                 | 更新                  | 删除                  |
| ---- | ---------------------------------------------- | ---------------------------------------------------- | --------------------- | --------------------- |
| 文档 | `createDocument`                               | `getDocument`、`listDocuments`                       | `updateDocument`      | `deleteDocument`      |
| 分块 | `createDocumentChunk`、`replaceDocumentChunks` | `getDocumentChunk`、`listDocumentChunks`             | `updateDocumentChunk` | `deleteDocumentChunk` |
| 向量 | `upsertEmbedding`                              | `getEmbedding`、`listEmbeddings`、`searchEmbeddings` | `upsertEmbedding`     | `deleteEmbedding`     |

查询不存在的数据返回 `undefined`，删除或更新不存在的数据返回 `false`。列表查询使用明确的排序；`listDocuments` 支持 `limit` 和 `offset`，单次最多返回 500 条。

## 文档与分块示例

```ts
const documentId = database.createDocument({
  source: "file:///notes/design.md",
  title: "Design notes",
  contentHash: "sha256:...",
});

database.updateDocument(documentId, { title: "Architecture notes" });

const chunkIds = database.replaceDocumentChunks(documentId, [
  { index: 0, content: "First chunk", contentHash: "sha256:..." },
]);

const extraChunkId = database.createDocumentChunk(documentId, {
  index: 1,
  content: "Second chunk",
  contentHash: "sha256:...",
});

database.updateDocumentChunk(extraChunkId, {
  content: "Updated second chunk",
  contentHash: "sha256:updated...",
});

database.deleteDocumentChunk(extraChunkId);
```

`replaceDocumentChunks` 会在事务中替换文档的所有分块并返回新的 chunk ID，同时清理旧分块关联的向量。局部变更使用单条分块 CRUD。

## 向量示例

```ts
const [chunkId] = chunkIds;
if (!chunkId) throw new Error("Chunk was not created.");

database.upsertEmbedding(chunkId, "embedding-model", new Float32Array(1536));

const results = database.searchEmbeddings(new Float32Array(1536), {
  model: "embedding-model",
  limit: 10,
});

database.deleteEmbedding(chunkId, "embedding-model");
```

`embeddingDimensions` 默认是 `1536`。所有向量都必须是相同长度的 `Float32Array`；模型名称由调用方保存并可用于检索过滤。`replaceDocumentChunks` 和 `deleteDocument` 会在事务中清理关联向量。

## 迁移与版本

打开数据库时会按版本顺序自动执行迁移。当前 schema 版本为 `2`，包含 `documents`、`document_chunks`、`embedding_metadata`、`document_embeddings`、`database_metadata` 和 `schema_migrations`；向量表使用模型 partition key 保证模型过滤发生在 KNN 检索阶段。数据库版本高于当前应用时会拒绝打开；配置的向量维度与已存在数据库不一致时也会拒绝打开。新增 schema 必须追加迁移版本，不得修改已发布迁移。

## 备份与恢复

```ts
import { restoreDatabaseBackup } from "../database/index.js";

await database.backup("/safe/backups/norafold.sqlite");
await restoreDatabaseBackup(
  "/safe/backups/norafold.sqlite",
  "/path/to/restored.sqlite",
  "/path/to/vec0.dylib",
);
```

恢复前必须关闭目标数据库连接；备份源和目标不能是同一路径。备份使用 Node SQLite Backup API，不应复制正在使用中的 WAL 文件来代替备份。

## 打包注意事项

原生扩展不能从 `app.asar` 加载。Electron Forge 的 `packageAfterCopy` hook 会把当前目标的 `vec0.dylib`、`vec0.dll` 或 `vec0.so` 复制到外部 resources，Main 进程再通过显式路径加载。当前支持的目标为 macOS arm64、macOS x64、Windows x64 和 Linux x64；其他目标会在打包时失败。

当前服务不负责生成 embedding、切分策略、RAG 编排或云端同步，这些能力应在上层 feature 中实现并通过本 API 调用。
