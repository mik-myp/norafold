import type { DatabaseSync } from "node:sqlite";

interface DatabaseMigration {
  readonly version: number;
  readonly up: (database: DatabaseSync, dimensions: number) => void;
}

const migrations: readonly DatabaseMigration[] = [
  {
    version: 1,
    up(database, dimensions) {
      database.exec(`
        CREATE TABLE database_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE documents (
          id INTEGER PRIMARY KEY,
          source TEXT NOT NULL,
          title TEXT,
          content_hash TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE document_chunks (
          id INTEGER PRIMARY KEY,
          document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(document_id, chunk_index)
        );
        CREATE TABLE embedding_metadata (
          id INTEGER PRIMARY KEY,
          chunk_id INTEGER NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
          model TEXT NOT NULL,
          dimensions INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(chunk_id, model)
        );
        CREATE VIRTUAL TABLE document_embeddings USING vec0(
          embedding float[${dimensions}]
        );
      `);
      database
        .prepare("INSERT INTO database_metadata(key, value) VALUES ('embedding_dimensions', ?)")
        .run(String(dimensions));
    },
  },
  {
    version: 2,
    up(database, dimensions) {
      database.exec(`
        CREATE TEMP TABLE embedding_vectors_backup AS
          SELECT vectors.rowid, vectors.embedding, metadata.model
          FROM document_embeddings AS vectors
          JOIN embedding_metadata AS metadata ON metadata.id = vectors.rowid;
        DROP TABLE document_embeddings;
        CREATE VIRTUAL TABLE document_embeddings USING vec0(
          embedding float[${dimensions}],
          model text partition key
        );
        INSERT INTO document_embeddings(rowid, embedding, model)
          SELECT rowid, embedding, model FROM embedding_vectors_backup;
        DROP TABLE embedding_vectors_backup;
      `);
    },
  },
];

export const currentDatabaseSchemaVersion = migrations.at(-1)?.version ?? 0;

export function runDatabaseMigrations(database: DatabaseSync, dimensions: number) {
  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    throw new RangeError("Vector dimensions must be a positive integer.");
  }
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = database
    .prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations")
    .get() as { version: number };
  if (applied.version > currentDatabaseSchemaVersion) {
    throw new Error(
      `Database schema version ${applied.version} is newer than supported version ${currentDatabaseSchemaVersion}.`,
    );
  }
  for (const migration of migrations) {
    if (migration.version <= applied.version) continue;
    database.exec("BEGIN IMMEDIATE;");
    try {
      migration.up(database, dimensions);
      database
        .prepare("INSERT INTO schema_migrations(version, applied_at) VALUES (?, datetime('now'))")
        .run(migration.version);
      database.exec("COMMIT;");
    } catch (error: unknown) {
      database.exec("ROLLBACK;");
      throw error;
    }
  }

  const metadata = database
    .prepare("SELECT value FROM database_metadata WHERE key = 'embedding_dimensions'")
    .get() as { value?: string } | undefined;
  if (!metadata || Number(metadata.value) !== dimensions) {
    throw new Error("Database embedding dimensions do not match the configured dimensions.");
  }
}
