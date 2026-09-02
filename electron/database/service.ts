import { mkdir } from "node:fs/promises";
import path from "node:path";
import { backup as sqliteBackup, type DatabaseSync } from "node:sqlite";
import { getSqliteVecExtensionPath, openSqliteDatabase } from "./driver.js";
import { currentDatabaseSchemaVersion, runDatabaseMigrations } from "./migrations.js";
import type {
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

export const defaultEmbeddingDimensions = 1536;

function assertText(value: string, name: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function assertChunkIndex(index: number) {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError("Chunk index must be a non-negative integer.");
  }
}

function assertPagination(options: DocumentListOptions) {
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;
  if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
    throw new RangeError("List limit must be an integer between 1 and 500.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError("List offset must be a non-negative integer.");
  }
  return { limit, offset };
}

function assertEmbedding(embedding: NodeJS.ArrayBufferView, dimensions: number) {
  if (!(embedding instanceof Float32Array) || embedding.length !== dimensions) {
    throw new RangeError(`Embedding must be a Float32Array with ${dimensions} values.`);
  }
}

function toSafeNumber(value: number | bigint, name: string) {
  const numberValue = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    throw new TypeError(`${name} must be a positive safe integer.`);
  }

  return numberValue;
}

export class NorafoldDatabase {
  readonly #database: DatabaseSync;
  readonly #location: string;
  readonly #status: DatabaseStatus;

  private constructor(database: DatabaseSync, location: string, status: DatabaseStatus) {
    this.#database = database;
    this.#location = location;
    this.#status = status;
  }

  static open(options: DatabaseOptions) {
    assertText(options.location, "Database location");
    const dimensions = options.embeddingDimensions ?? defaultEmbeddingDimensions;
    const database = openSqliteDatabase(options.location, options.extensionPath);
    try {
      runDatabaseMigrations(database, dimensions);
      return new NorafoldDatabase(database, options.location, {
        schemaVersion: currentDatabaseSchemaVersion,
        embeddingDimensions: dimensions,
      });
    } catch (error: unknown) {
      database.close();
      throw error;
    }
  }

  get status(): DatabaseStatus {
    return this.#status;
  }

  createDocument(input: DocumentInput): number {
    assertText(input.source, "Document source");
    if (input.title !== undefined && typeof input.title !== "string") {
      throw new TypeError("Document title must be a string.");
    }
    if (input.contentHash !== undefined) {
      assertText(input.contentHash, "Document content hash");
    }
    const result = this.#database
      .prepare("INSERT INTO documents(source, title, content_hash) VALUES (?, ?, ?)")
      .run(input.source, input.title ?? null, input.contentHash ?? null);
    return toSafeNumber(result.lastInsertRowid, "Document id");
  }

  getDocument(documentId: number): DocumentRecord | undefined {
    const safeDocumentId = toSafeNumber(documentId, "Document id");
    const row = this.#database
      .prepare(
        "SELECT id, source, title, content_hash, created_at, updated_at FROM documents WHERE id = ?",
      )
      .get(safeDocumentId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    if (
      typeof row.id !== "number" ||
      typeof row.source !== "string" ||
      (row.title !== null && typeof row.title !== "string") ||
      (row.content_hash !== null && typeof row.content_hash !== "string") ||
      typeof row.created_at !== "string" ||
      typeof row.updated_at !== "string"
    ) {
      throw new TypeError("Invalid document record.");
    }
    return {
      id: row.id,
      source: row.source,
      title: row.title,
      contentHash: row.content_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  listDocuments(options: DocumentListOptions = {}): DocumentRecord[] {
    const { limit, offset } = assertPagination(options);
    return (
      this.#database
        .prepare(
          "SELECT id, source, title, content_hash, created_at, updated_at FROM documents ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?",
        )
        .all(limit, offset) as Array<Record<string, unknown>>
    ).map((row) => {
      if (
        typeof row.id !== "number" ||
        typeof row.source !== "string" ||
        (row.title !== null && typeof row.title !== "string") ||
        (row.content_hash !== null && typeof row.content_hash !== "string") ||
        typeof row.created_at !== "string" ||
        typeof row.updated_at !== "string"
      ) {
        throw new TypeError("Invalid document record.");
      }
      return {
        id: row.id,
        source: row.source,
        title: row.title,
        contentHash: row.content_hash,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  updateDocument(documentId: number, input: DocumentUpdateInput): boolean {
    const safeDocumentId = toSafeNumber(documentId, "Document id");
    const entries: Array<[string, string | null]> = [];
    if (input.source !== undefined) {
      assertText(input.source, "Document source");
      entries.push(["source", input.source]);
    }
    if (input.title !== undefined) {
      if (input.title !== null) assertText(input.title, "Document title");
      entries.push(["title", input.title]);
    }
    if (input.contentHash !== undefined) {
      if (input.contentHash !== null) assertText(input.contentHash, "Document content hash");
      entries.push(["content_hash", input.contentHash]);
    }
    if (entries.length === 0) throw new RangeError("At least one document field is required.");
    const assignments = entries.map(([field]) => `${field} = ?`).join(", ");
    const result = this.#database
      .prepare(`UPDATE documents SET ${assignments}, updated_at = datetime('now') WHERE id = ?`)
      .run(...entries.map(([, value]) => value), safeDocumentId);
    return Number(result.changes) > 0;
  }

  replaceDocumentChunks(documentId: number, chunks: readonly DocumentChunkInput[]) {
    const safeDocumentId = toSafeNumber(documentId, "Document id");
    if (!this.#database.prepare("SELECT 1 FROM documents WHERE id = ?").get(safeDocumentId)) {
      throw new Error(`Document ${safeDocumentId} does not exist.`);
    }
    for (const chunk of chunks) {
      assertChunkIndex(chunk.index);
      assertText(chunk.content, "Chunk content");
      assertText(chunk.contentHash, "Chunk content hash");
    }

    this.#database.exec("BEGIN IMMEDIATE;");
    try {
      const embeddingIds = this.#database
        .prepare(
          "SELECT e.id FROM embedding_metadata e JOIN document_chunks c ON c.id = e.chunk_id WHERE c.document_id = ?",
        )
        .all(safeDocumentId) as Array<{ id: number }>;
      const deleteVector = this.#database.prepare(
        "DELETE FROM document_embeddings WHERE rowid = ?",
      );
      for (const embedding of embeddingIds) deleteVector.run(BigInt(embedding.id));
      this.#database
        .prepare("DELETE FROM document_chunks WHERE document_id = ?")
        .run(safeDocumentId);
      const insert = this.#database.prepare(
        "INSERT INTO document_chunks(document_id, chunk_index, content, content_hash) VALUES (?, ?, ?, ?)",
      );
      const chunkIds: number[] = [];
      for (const chunk of chunks) {
        const result = insert.run(safeDocumentId, chunk.index, chunk.content, chunk.contentHash);
        chunkIds.push(toSafeNumber(result.lastInsertRowid, "Chunk id"));
      }
      this.#database
        .prepare("UPDATE documents SET updated_at = datetime('now') WHERE id = ?")
        .run(safeDocumentId);
      this.#database.exec("COMMIT;");
      return chunkIds;
    } catch (error: unknown) {
      this.#database.exec("ROLLBACK;");
      throw error;
    }
  }

  createDocumentChunk(documentId: number, input: DocumentChunkInput): number {
    const safeDocumentId = toSafeNumber(documentId, "Document id");
    assertChunkIndex(input.index);
    assertText(input.content, "Chunk content");
    assertText(input.contentHash, "Chunk content hash");
    if (!this.#database.prepare("SELECT 1 FROM documents WHERE id = ?").get(safeDocumentId)) {
      throw new Error(`Document ${safeDocumentId} does not exist.`);
    }
    this.#database.exec("BEGIN IMMEDIATE;");
    try {
      const result = this.#database
        .prepare(
          "INSERT INTO document_chunks(document_id, chunk_index, content, content_hash) VALUES (?, ?, ?, ?)",
        )
        .run(safeDocumentId, input.index, input.content, input.contentHash);
      this.#database
        .prepare("UPDATE documents SET updated_at = datetime('now') WHERE id = ?")
        .run(safeDocumentId);
      this.#database.exec("COMMIT;");
      return toSafeNumber(result.lastInsertRowid, "Chunk id");
    } catch (error: unknown) {
      this.#database.exec("ROLLBACK;");
      throw error;
    }
  }

  listDocumentChunks(documentId: number): DocumentChunkRecord[] {
    const safeDocumentId = toSafeNumber(documentId, "Document id");
    return (
      this.#database
        .prepare(
          "SELECT id, document_id, chunk_index, content, content_hash, created_at FROM document_chunks WHERE document_id = ? ORDER BY chunk_index",
        )
        .all(safeDocumentId) as Array<Record<string, unknown>>
    ).map((row) => {
      if (
        typeof row.id !== "number" ||
        typeof row.document_id !== "number" ||
        typeof row.chunk_index !== "number" ||
        typeof row.content !== "string" ||
        typeof row.content_hash !== "string" ||
        typeof row.created_at !== "string"
      ) {
        throw new TypeError("Invalid document chunk record.");
      }
      return {
        id: row.id,
        documentId: row.document_id,
        index: row.chunk_index,
        content: row.content,
        contentHash: row.content_hash,
        createdAt: row.created_at,
      };
    });
  }

  getDocumentChunk(chunkId: number): DocumentChunkRecord | undefined {
    const safeChunkId = toSafeNumber(chunkId, "Chunk id");
    const row = this.#database
      .prepare(
        "SELECT id, document_id, chunk_index, content, content_hash, created_at FROM document_chunks WHERE id = ?",
      )
      .get(safeChunkId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    if (
      typeof row.id !== "number" ||
      typeof row.document_id !== "number" ||
      typeof row.chunk_index !== "number" ||
      typeof row.content !== "string" ||
      typeof row.content_hash !== "string" ||
      typeof row.created_at !== "string"
    ) {
      throw new TypeError("Invalid document chunk record.");
    }
    return {
      id: row.id,
      documentId: row.document_id,
      index: row.chunk_index,
      content: row.content,
      contentHash: row.content_hash,
      createdAt: row.created_at,
    };
  }

  updateDocumentChunk(chunkId: number, input: DocumentChunkUpdateInput): boolean {
    const safeChunkId = toSafeNumber(chunkId, "Chunk id");
    const entries: Array<[string, string | number]> = [];
    if (input.index !== undefined) {
      assertChunkIndex(input.index);
      entries.push(["chunk_index", input.index]);
    }
    if (input.content !== undefined) {
      assertText(input.content, "Chunk content");
      entries.push(["content", input.content]);
    }
    if (input.contentHash !== undefined) {
      assertText(input.contentHash, "Chunk content hash");
      entries.push(["content_hash", input.contentHash]);
    }
    if (entries.length === 0) throw new RangeError("At least one chunk field is required.");
    const assignments = entries.map(([field]) => `${field} = ?`).join(", ");
    this.#database.exec("BEGIN IMMEDIATE;");
    try {
      const chunk = this.#database
        .prepare("SELECT document_id FROM document_chunks WHERE id = ?")
        .get(safeChunkId) as { document_id: number } | undefined;
      if (!chunk) {
        this.#database.exec("COMMIT;");
        return false;
      }
      this.#database
        .prepare(`UPDATE document_chunks SET ${assignments} WHERE id = ?`)
        .run(...entries.map(([, value]) => value), safeChunkId);
      this.#database
        .prepare("UPDATE documents SET updated_at = datetime('now') WHERE id = ?")
        .run(chunk.document_id);
      this.#database.exec("COMMIT;");
      return true;
    } catch (error: unknown) {
      this.#database.exec("ROLLBACK;");
      throw error;
    }
  }

  deleteDocumentChunk(chunkId: number): boolean {
    const safeChunkId = toSafeNumber(chunkId, "Chunk id");
    this.#database.exec("BEGIN IMMEDIATE;");
    try {
      const chunk = this.#database
        .prepare("SELECT document_id FROM document_chunks WHERE id = ?")
        .get(safeChunkId) as { document_id: number } | undefined;
      if (!chunk) {
        this.#database.exec("COMMIT;");
        return false;
      }
      const embeddingIds = this.#database
        .prepare("SELECT id FROM embedding_metadata WHERE chunk_id = ?")
        .all(safeChunkId) as Array<{ id: number }>;
      const deleteVector = this.#database.prepare(
        "DELETE FROM document_embeddings WHERE rowid = ?",
      );
      for (const embedding of embeddingIds) deleteVector.run(BigInt(embedding.id));
      const result = this.#database
        .prepare("DELETE FROM document_chunks WHERE id = ?")
        .run(safeChunkId);
      this.#database
        .prepare("UPDATE documents SET updated_at = datetime('now') WHERE id = ?")
        .run(chunk.document_id);
      this.#database.exec("COMMIT;");
      return Number(result.changes) > 0;
    } catch (error: unknown) {
      this.#database.exec("ROLLBACK;");
      throw error;
    }
  }

  getEmbedding(chunkId: number, model: string): EmbeddingRecord | undefined {
    const safeChunkId = toSafeNumber(chunkId, "Chunk id");
    assertText(model, "Embedding model");
    const row = this.#database
      .prepare(
        "SELECT id, chunk_id, model, dimensions, created_at FROM embedding_metadata WHERE chunk_id = ? AND model = ?",
      )
      .get(safeChunkId, model) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    if (
      typeof row.id !== "number" ||
      typeof row.chunk_id !== "number" ||
      typeof row.model !== "string" ||
      typeof row.dimensions !== "number" ||
      typeof row.created_at !== "string"
    ) {
      throw new TypeError("Invalid embedding record.");
    }
    return {
      id: row.id,
      chunkId: row.chunk_id,
      model: row.model,
      dimensions: row.dimensions,
      createdAt: row.created_at,
    };
  }

  listEmbeddings(chunkId: number): EmbeddingRecord[] {
    const safeChunkId = toSafeNumber(chunkId, "Chunk id");
    return (
      this.#database
        .prepare(
          "SELECT id, chunk_id, model, dimensions, created_at FROM embedding_metadata WHERE chunk_id = ? ORDER BY model",
        )
        .all(safeChunkId) as Array<Record<string, unknown>>
    ).map((row) => {
      if (
        typeof row.id !== "number" ||
        typeof row.chunk_id !== "number" ||
        typeof row.model !== "string" ||
        typeof row.dimensions !== "number" ||
        typeof row.created_at !== "string"
      ) {
        throw new TypeError("Invalid embedding record.");
      }
      return {
        id: row.id,
        chunkId: row.chunk_id,
        model: row.model,
        dimensions: row.dimensions,
        createdAt: row.created_at,
      };
    });
  }

  deleteEmbedding(chunkId: number, model: string): boolean {
    const safeChunkId = toSafeNumber(chunkId, "Chunk id");
    assertText(model, "Embedding model");
    this.#database.exec("BEGIN IMMEDIATE;");
    try {
      const embedding = this.#database
        .prepare("SELECT id FROM embedding_metadata WHERE chunk_id = ? AND model = ?")
        .get(safeChunkId, model) as { id: number } | undefined;
      if (!embedding) {
        this.#database.exec("COMMIT;");
        return false;
      }
      this.#database
        .prepare("DELETE FROM document_embeddings WHERE rowid = ?")
        .run(BigInt(embedding.id));
      this.#database.prepare("DELETE FROM embedding_metadata WHERE id = ?").run(embedding.id);
      this.#database.exec("COMMIT;");
      return true;
    } catch (error: unknown) {
      this.#database.exec("ROLLBACK;");
      throw error;
    }
  }

  upsertEmbedding(chunkId: number, model: string, embedding: Float32Array): number {
    const safeChunkId = toSafeNumber(chunkId, "Chunk id");
    assertText(model, "Embedding model");
    assertEmbedding(embedding, this.#status.embeddingDimensions);
    if (!this.#database.prepare("SELECT 1 FROM document_chunks WHERE id = ?").get(safeChunkId)) {
      throw new Error(`Chunk ${safeChunkId} does not exist.`);
    }

    this.#database.exec("BEGIN IMMEDIATE;");
    try {
      const existing = this.#database
        .prepare("SELECT id FROM embedding_metadata WHERE chunk_id = ? AND model = ?")
        .get(safeChunkId, model) as { id: number } | undefined;
      let embeddingId: number;
      if (existing) {
        embeddingId = existing.id;
        this.#database
          .prepare("DELETE FROM document_embeddings WHERE rowid = ?")
          .run(BigInt(embeddingId));
        this.#database
          .prepare(
            "UPDATE embedding_metadata SET dimensions = ?, created_at = datetime('now') WHERE id = ?",
          )
          .run(this.#status.embeddingDimensions, embeddingId);
      } else {
        const result = this.#database
          .prepare("INSERT INTO embedding_metadata(chunk_id, model, dimensions) VALUES (?, ?, ?)")
          .run(safeChunkId, model, this.#status.embeddingDimensions);
        embeddingId = toSafeNumber(result.lastInsertRowid, "Embedding id");
      }
      this.#database
        .prepare("INSERT INTO document_embeddings(rowid, embedding, model) VALUES (?, ?, ?)")
        .run(BigInt(embeddingId), embedding, model);
      this.#database.exec("COMMIT;");
      return embeddingId;
    } catch (error: unknown) {
      this.#database.exec("ROLLBACK;");
      throw error;
    }
  }

  deleteDocument(documentId: number) {
    const safeDocumentId = toSafeNumber(documentId, "Document id");
    this.#database.exec("BEGIN IMMEDIATE;");
    try {
      const embeddingIds = this.#database
        .prepare(
          "SELECT e.id FROM embedding_metadata e JOIN document_chunks c ON c.id = e.chunk_id WHERE c.document_id = ?",
        )
        .all(safeDocumentId) as Array<{ id: number }>;
      const deleteVector = this.#database.prepare(
        "DELETE FROM document_embeddings WHERE rowid = ?",
      );
      for (const embedding of embeddingIds) deleteVector.run(BigInt(embedding.id));
      const result = this.#database
        .prepare("DELETE FROM documents WHERE id = ?")
        .run(safeDocumentId);
      this.#database.exec("COMMIT;");
      return Number(result.changes) > 0;
    } catch (error: unknown) {
      this.#database.exec("ROLLBACK;");
      throw error;
    }
  }

  searchEmbeddings(embedding: Float32Array, options: VectorSearchOptions): VectorSearchRecord[] {
    if (!Number.isInteger(options.limit) || options.limit <= 0) {
      throw new RangeError("Search limit must be a positive integer.");
    }
    assertEmbedding(embedding, this.#status.embeddingDimensions);
    if (options.model !== undefined) assertText(options.model, "Embedding model");
    const rows =
      options.model === undefined
        ? this.#database
            .prepare(
              "SELECT e.rowid AS embedding_id, e.distance, m.chunk_id, m.model, c.document_id, c.chunk_index, c.content FROM document_embeddings e JOIN embedding_metadata m ON m.id = e.rowid JOIN document_chunks c ON c.id = m.chunk_id WHERE e.embedding MATCH ? AND e.k = ? ORDER BY e.distance",
            )
            .all(embedding, options.limit)
        : this.#database
            .prepare(
              "SELECT e.rowid AS embedding_id, e.distance, m.chunk_id, m.model, c.document_id, c.chunk_index, c.content FROM document_embeddings e JOIN embedding_metadata m ON m.id = e.rowid JOIN document_chunks c ON c.id = m.chunk_id WHERE e.embedding MATCH ? AND e.k = ? AND e.model = ? ORDER BY e.distance",
            )
            .all(embedding, options.limit, options.model);
    return rows.map((row) => {
      if (typeof row !== "object" || row === null)
        throw new TypeError("Invalid vector search result.");
      const value = row as Record<string, unknown>;
      if (
        typeof value.chunk_id !== "number" ||
        typeof value.document_id !== "number" ||
        typeof value.chunk_index !== "number" ||
        typeof value.content !== "string" ||
        typeof value.model !== "string" ||
        typeof value.distance !== "number"
      )
        throw new TypeError("Invalid vector search result.");
      return {
        chunkId: value.chunk_id,
        documentId: value.document_id,
        chunkIndex: value.chunk_index,
        content: value.content,
        model: value.model,
        distance: value.distance,
      };
    });
  }

  async backup(destination: string) {
    assertText(destination, "Backup destination");
    if (path.resolve(destination) === path.resolve(this.#location)) {
      throw new Error("Backup destination must differ from the active database.");
    }
    await mkdir(path.dirname(path.resolve(destination)), { recursive: true });
    return sqliteBackup(this.#database, destination);
  }

  close() {
    this.#database.close();
  }
}

export function openDatabase(options: DatabaseOptions) {
  return NorafoldDatabase.open(options);
}

export async function restoreDatabaseBackup(
  backupPath: string,
  destinationPath: string,
  extensionPath = getSqliteVecExtensionPath(),
) {
  assertText(backupPath, "Backup source");
  assertText(destinationPath, "Restore destination");
  if (path.resolve(backupPath) === path.resolve(destinationPath)) {
    throw new Error("Restore source and destination must differ.");
  }
  await mkdir(path.dirname(path.resolve(destinationPath)), { recursive: true });
  const source = openSqliteDatabase(backupPath, extensionPath, true);
  try {
    return await sqliteBackup(source, destinationPath);
  } finally {
    source.close();
  }
}
