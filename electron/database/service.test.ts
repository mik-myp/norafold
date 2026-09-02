import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { arch, platform } from "node:process";
import { describe, expect, it } from "vite-plus/test";
import { openSqliteDatabase } from "./driver.js";
import { getSqliteVecExtensionPath, openDatabase, restoreDatabaseBackup } from "./index.js";
import type { DocumentChunkInput } from "./types.js";

describe("SQLite driver", () => {
  it("resolves the current platform extension", () => {
    const packagePlatform = platform === "win32" ? "windows" : platform;
    const extensionName =
      platform === "darwin" ? "vec0.dylib" : platform === "win32" ? "vec0.dll" : "vec0.so";
    expect(getSqliteVecExtensionPath()).toContain(
      `sqlite-vec-${packagePlatform}-${arch}/${extensionName}`,
    );
    expect(getSqliteVecExtensionPath({ packaged: true, resourcesPath: "/resources" })).toBe(
      `/resources/${extensionName}`,
    );
  });

  it("loads sqlite-vec and exposes its version", () => {
    const database = openSqliteDatabase(":memory:");

    try {
      expect(database.prepare("SELECT vec_version() AS version").get()).toEqual({
        version: "v0.1.9",
      });
    } finally {
      database.close();
    }
  });

  it("enables foreign keys", () => {
    const database = openSqliteDatabase(":memory:");

    try {
      expect(database.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    } finally {
      database.close();
    }
  });
});

describe("NorafoldDatabase", () => {
  it("migrates the schema and manages documents, chunks, and model-aware vectors", () => {
    const database = openDatabase({ location: ":memory:", embeddingDimensions: 3 });
    try {
      expect(database.status).toEqual({ schemaVersion: 2, embeddingDimensions: 3 });
      const documentId = database.createDocument({ source: "file:///notes.md" });
      expect(database.getDocument(documentId)).toMatchObject({
        id: documentId,
        source: "file:///notes.md",
        title: null,
      });
      expect(database.updateDocument(documentId, { title: "Notes", contentHash: "doc-hash" })).toBe(
        true,
      );
      expect(database.listDocuments({ limit: 10 })).toMatchObject([
        { id: documentId, title: "Notes", contentHash: "doc-hash" },
      ]);
      const chunks: DocumentChunkInput[] = [
        { index: 0, content: "alpha", contentHash: "hash-alpha" },
        { index: 1, content: "beta", contentHash: "hash-beta" },
      ];
      const chunkIds = database.replaceDocumentChunks(documentId, chunks);
      expect(chunkIds).toHaveLength(2);
      expect(database.listDocumentChunks(documentId)).toMatchObject([
        { id: chunkIds[0], documentId, index: 0, content: "alpha" },
        { id: chunkIds[1], documentId, index: 1, content: "beta" },
      ]);
      expect(database.getDocumentChunk(chunkIds[0]!)).toMatchObject({ content: "alpha" });
      expect(
        database.updateDocumentChunk(chunkIds[0]!, {
          content: "updated alpha",
          contentHash: "updated-hash",
        }),
      ).toBe(true);
      const appendedChunkId = database.createDocumentChunk(documentId, {
        index: 2,
        content: "gamma",
        contentHash: "hash-gamma",
      });
      expect(database.getDocumentChunk(appendedChunkId)).toMatchObject({
        documentId,
        index: 2,
      });
      database.upsertEmbedding(chunkIds[0]!, "model-a", new Float32Array([1, 0, 0]));
      database.upsertEmbedding(chunkIds[1]!, "model-b", new Float32Array([0, 1, 0]));
      expect(database.getEmbedding(chunkIds[0]!, "model-a")).toMatchObject({
        chunkId: chunkIds[0],
        model: "model-a",
        dimensions: 3,
      });
      expect(database.listEmbeddings(chunkIds[0]!)).toMatchObject([
        { chunkId: chunkIds[0], model: "model-a", dimensions: 3 },
      ]);
      expect(
        database.searchEmbeddings(new Float32Array([0, 1, 0]), { model: "model-a", limit: 1 }),
      ).toMatchObject([
        { chunkId: chunkIds[0], documentId, model: "model-a", content: "updated alpha" },
      ]);
      expect(database.searchEmbeddings(new Float32Array([0, 1, 0]), { limit: 2 })).toHaveLength(2);
      expect(database.deleteEmbedding(chunkIds[0]!, "model-a")).toBe(true);
      expect(database.deleteEmbedding(chunkIds[0]!, "model-a")).toBe(false);
      expect(database.deleteDocumentChunk(chunkIds[1]!)).toBe(true);
      expect(database.deleteDocumentChunk(chunkIds[1]!)).toBe(false);
      expect(database.deleteDocumentChunk(appendedChunkId)).toBe(true);
      expect(database.deleteDocument(documentId)).toBe(true);
      expect(database.deleteDocument(documentId)).toBe(false);
    } finally {
      database.close();
    }
  });

  it("rejects invalid dimensions and vectors", () => {
    expect(() => openDatabase({ location: ":memory:", embeddingDimensions: 0 })).toThrow(
      RangeError,
    );
    const database = openDatabase({ location: ":memory:", embeddingDimensions: 3 });
    try {
      const documentId = database.createDocument({ source: "source" });
      const [chunkId] = database.replaceDocumentChunks(documentId, [
        { index: 0, content: "content", contentHash: "hash" },
      ]);
      expect(() => database.upsertEmbedding(chunkId!, "model", new Float32Array([1, 0]))).toThrow(
        RangeError,
      );
      expect(() => database.searchEmbeddings(new Float32Array([1, 0]), { limit: 1 })).toThrow(
        RangeError,
      );
      expect(() => database.listDocuments({ limit: 0 })).toThrow(RangeError);
      expect(() => database.updateDocument(documentId, {})).toThrow(RangeError);
      expect(() => database.updateDocumentChunk(chunkId!, {})).toThrow(RangeError);
      expect(database.getDocument(999)).toBeUndefined();
      expect(database.getDocumentChunk(999)).toBeUndefined();
    } finally {
      database.close();
    }
  });

  it("keeps migrations idempotent and rejects a dimension mismatch", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "norafold-db-migration-"));
    const location = path.join(directory, "norafold.sqlite");
    const first = openDatabase({ location, embeddingDimensions: 3 });
    first.close();
    const reopened = openDatabase({ location, embeddingDimensions: 3 });
    try {
      expect(reopened.status).toEqual({ schemaVersion: 2, embeddingDimensions: 3 });
      const documentId = reopened.createDocument({ source: "source" });
      const [chunkId] = reopened.replaceDocumentChunks(documentId, [
        { index: 0, content: "content", contentHash: "hash" },
      ]);
      const embeddingId = reopened.upsertEmbedding(chunkId!, "model", new Float32Array([1, 0, 0]));
      expect(reopened.upsertEmbedding(chunkId!, "model", new Float32Array([0, 1, 0]))).toBe(
        embeddingId,
      );
    } finally {
      reopened.close();
      expect(() => openDatabase({ location, embeddingDimensions: 4 })).toThrow(
        /embedding dimensions/i,
      );
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("migrates existing model metadata into vector partitions", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "norafold-db-v1-"));
    const location = path.join(directory, "norafold.sqlite");
    const legacy = openSqliteDatabase(location);
    legacy.exec(`
      CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO schema_migrations VALUES (1, datetime('now'));
      CREATE TABLE database_metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO database_metadata VALUES ('embedding_dimensions', '3');
      CREATE TABLE documents(id INTEGER PRIMARY KEY, source TEXT NOT NULL, title TEXT, content_hash TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      INSERT INTO documents VALUES (1, 'source', NULL, NULL, datetime('now'), datetime('now'));
      CREATE TABLE document_chunks(id INTEGER PRIMARY KEY, document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE, chunk_index INTEGER NOT NULL, content TEXT NOT NULL, content_hash TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(document_id, chunk_index));
      INSERT INTO document_chunks VALUES (1, 1, 0, 'content', 'hash', datetime('now'));
      CREATE TABLE embedding_metadata(id INTEGER PRIMARY KEY, chunk_id INTEGER NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE, model TEXT NOT NULL, dimensions INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(chunk_id, model));
      INSERT INTO embedding_metadata VALUES (1, 1, 'legacy-model', 3, datetime('now'));
      CREATE VIRTUAL TABLE document_embeddings USING vec0(embedding float[3]);
    `);
    legacy
      .prepare("INSERT INTO document_embeddings(rowid, embedding) VALUES (?, ?)")
      .run(1n, new Float32Array([1, 0, 0]));
    legacy.close();

    const migrated = openDatabase({ location, embeddingDimensions: 3 });
    try {
      expect(migrated.status.schemaVersion).toBe(2);
      expect(
        migrated.searchEmbeddings(new Float32Array([1, 0, 0]), {
          model: "legacy-model",
          limit: 1,
        }),
      ).toMatchObject([{ chunkId: 1, model: "legacy-model", content: "content" }]);
    } finally {
      migrated.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("backs up and restores a file database", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "norafold-db-backup-"));
    const sourcePath = path.join(directory, "source.sqlite");
    const backupPath = path.join(directory, "backup", "norafold.sqlite");
    const restoredPath = path.join(directory, "restored.sqlite");
    const source = openDatabase({ location: sourcePath, embeddingDimensions: 3 });
    try {
      const documentId = source.createDocument({ source: "source" });
      source.replaceDocumentChunks(documentId, [
        { index: 0, content: "persisted", contentHash: "hash" },
      ]);
      await source.backup(backupPath);
    } finally {
      source.close();
    }
    await restoreDatabaseBackup(backupPath, restoredPath);
    const restored = openDatabase({ location: restoredPath, embeddingDimensions: 3 });
    try {
      expect(restored.listDocumentChunks(1)).toMatchObject([{ content: "persisted" }]);
    } finally {
      restored.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
