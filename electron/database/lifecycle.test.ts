import { afterEach, describe, expect, it } from "vite-plus/test";
import { closeDatabase, getDatabase, initializeDatabase } from "./index.js";

describe("database lifecycle", () => {
  afterEach(() => closeDatabase());

  it("owns one application database instance", () => {
    expect(() => getDatabase()).toThrow(/not initialized/i);
    const initialized = initializeDatabase({ location: ":memory:", embeddingDimensions: 3 });
    expect(getDatabase()).toBe(initialized);
    expect(() => initializeDatabase({ location: ":memory:", embeddingDimensions: 3 })).toThrow(
      /already initialized/i,
    );
    closeDatabase();
    expect(() => getDatabase()).toThrow(/not initialized/i);
  });
});
