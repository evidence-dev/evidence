import { describe, expect, it } from "vitest";
import { CONNECTION_TYPES, getConnectionSchema } from "./connection-schema";

describe("DuckDB connector registry", () => {
  it("registers DuckDB as a connection type", () => {
    expect(CONNECTION_TYPES).toContain("duckdb");
  });

  it("resolves the DuckDB connection schema", () => {
    const schema = getConnectionSchema("duckdb");

    expect(schema.parse({ type: "duckdb" })).toEqual({
      type: "duckdb",
      database: ":memory:",
      schemas: [],
    });
  });

  it("rejects invalid DuckDB configuration", () => {
    const schema = getConnectionSchema("duckdb");

    expect(
      schema.safeParse({
        type: "duckdb",
        database: "  ",
      }).success,
    ).toBe(false);
  });
});
