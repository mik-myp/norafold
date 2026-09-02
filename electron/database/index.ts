export {
  defaultEmbeddingDimensions,
  NorafoldDatabase,
  openDatabase,
  restoreDatabaseBackup,
} from "./service.js";

export { getSqliteVecExtensionPath } from "./driver.js";
export { closeDatabase, getDatabase, initializeDatabase } from "./lifecycle.js";
export { currentDatabaseSchemaVersion } from "./migrations.js";

export type {
  DatabaseOptions,
  DatabaseStatus,
  DocumentChunkInput,
  DocumentChunkRecord,
  DocumentChunkUpdateInput,
  DocumentInput,
  DocumentListOptions,
  DocumentRecord,
  DocumentUpdateInput,
  EmbeddingRecord,
  VectorSearchOptions,
  VectorSearchRecord,
} from "./types.js";
