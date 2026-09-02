export interface DatabaseOptions {
  readonly location: string;
  readonly extensionPath?: string;
  readonly embeddingDimensions?: number;
}

export interface DatabaseStatus {
  readonly schemaVersion: number;
  readonly embeddingDimensions: number;
}

export interface DocumentInput {
  readonly source: string;
  readonly title?: string;
  readonly contentHash?: string;
}

export interface DocumentUpdateInput {
  readonly source?: string;
  readonly title?: string | null;
  readonly contentHash?: string | null;
}

export interface DocumentRecord {
  readonly id: number;
  readonly source: string;
  readonly title: string | null;
  readonly contentHash: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DocumentListOptions {
  readonly limit?: number;
  readonly offset?: number;
}

export interface DocumentChunkInput {
  readonly index: number;
  readonly content: string;
  readonly contentHash: string;
}

export interface DocumentChunkUpdateInput {
  readonly index?: number;
  readonly content?: string;
  readonly contentHash?: string;
}

export interface DocumentChunkRecord {
  readonly id: number;
  readonly documentId: number;
  readonly index: number;
  readonly content: string;
  readonly contentHash: string;
  readonly createdAt: string;
}

export interface EmbeddingRecord {
  readonly id: number;
  readonly chunkId: number;
  readonly model: string;
  readonly dimensions: number;
  readonly createdAt: string;
}

export interface VectorSearchOptions {
  readonly model?: string;
  readonly limit: number;
}

export interface VectorSearchRecord {
  readonly chunkId: number;
  readonly documentId: number;
  readonly chunkIndex: number;
  readonly content: string;
  readonly model: string;
  readonly distance: number;
}
