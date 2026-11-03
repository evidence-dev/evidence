import { describe, expect, it } from "vitest";
import { duckdbConnectionSchema } from "./connection-schema";

describe("DuckDB connection schema", () => {
  it("uses an in-memory database by default", () => {
    const result = duckdbConnectionSchema.parse({
      type: "duckdb",
    });

    expect(result).toEqual({
      type: "duckdb",
      database: ":memory:",
      schemas: [],
    });
  });

  it("accepts a local database path", () => {
    const result = duckdbConnectionSchema.parse({
      type: "duckdb",
      database: "./data/analytics.duckdb",
      schemas: ["main"],
    });

    expect(result.database).toBe("./data/analytics.duckdb");
    expect(result.schemas).toEqual(["main"]);
  });

  it("rejects an empty database path", () => {
    const result = duckdbConnectionSchema.safeParse({
      type: "duckdb",
      database: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty schema names", () => {
    const result = duckdbConnectionSchema.safeParse({
      type: "duckdb",
      schemas: [""],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unsupported connection type", () => {
    const result = duckdbConnectionSchema.safeParse({
      type: "postgres",
    });

    expect(result.success).toBe(false);
  });
});
