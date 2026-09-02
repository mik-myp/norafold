# ADR 0004: SQLite and sqlite-vec Validation

- Status: Accepted
- Date: 2026-09-02

## Context

Norafold is an offline Electron application that will need relational storage and local vector search for RAG. The supported database and release targets are macOS arm64/x64, Windows x64, and Linux x64.

## Validation

The isolated Main-process PoC uses Electron 44's Node 24 `node:sqlite` API with `sqlite-vec` 0.1.9. On the current macOS arm64 host it successfully:

- loads `sqlite-vec` when `DatabaseSync` is created with `allowExtension: true`;
- creates a `vec0` table and performs KNN search;
- persists vectors in a file-backed database and reads them after reopening;
- passes the project's Vite+ checks, unit tests, Forge make, and packaged smoke test.

`vec0` row IDs must be bound as SQLite INTEGER values. With `node:sqlite`, converting safe positive IDs to `BigInt` is required; ordinary JavaScript numbers are rejected by the extension.

## Packaging Finding

Vite bundles the `sqlite-vec` JavaScript loader into the Main bundle, but the architecture-specific native extension is not automatically placed in `app.asar`. The production integration copies `vec0.dylib`, `vec0.dll`, or `vec0.so` to an external resource using Forge's `packageAfterCopy` hook, then loads that explicit path from the Main process. The loader must not resolve a native extension from inside `asar`.

## Decision

SQLite + `sqlite-vec` is approved for the four supported targets. The database service owns migrations, relational document/chunk metadata, model-aware vector search, and backup/restore in the Electron Main process. PGlite + pgvector remains a future alternative only if measured workload requirements invalidate this choice.

## Consequences

- The database is initialized during normal startup at the Electron `userData` location and is never exposed directly to Renderer code.
- Migrations, backup/recovery, vector dimension/model validation, and Main-process boundaries are part of the reusable database service.
- Release validation covers macOS arm64/x64, Windows x64, and Linux x64; unsupported targets fail packaging rather than silently shipping without vector storage.
