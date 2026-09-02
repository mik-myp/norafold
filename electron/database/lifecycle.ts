import { NorafoldDatabase } from "./service.js";
import type { DatabaseOptions } from "./types.js";

let activeDatabase: NorafoldDatabase | undefined;

export function initializeDatabase(options: DatabaseOptions) {
  if (activeDatabase) {
    throw new Error("Database is already initialized.");
  }
  activeDatabase = NorafoldDatabase.open(options);
  return activeDatabase;
}

export function getDatabase() {
  if (!activeDatabase) {
    throw new Error("Database is not initialized.");
  }
  return activeDatabase;
}

export function closeDatabase() {
  if (!activeDatabase) return;
  const database = activeDatabase;
  activeDatabase = undefined;
  database.close();
}
