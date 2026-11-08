import { describe, expect, it } from "vitest";
import { dialectFor, MotherDuckDialect } from "../../sql-dialect";
import { WAREHOUSE_MODES } from "../warehouse-mode";
import { schemaAllowlist } from "../schema-allowlist";

describe("DuckDB runtime routing", () => {
  it("recognizes DuckDB as a warehouse mode", () => {
    expect(WAREHOUSE_MODES).toContain("duckdb");
  });

  it("reuses the DuckDB-compatible MotherDuck dialect", () => {
    const dialect = dialectFor("duckdb");

    expect(dialect).toBeInstanceOf(MotherDuckDialect);
    expect(dialect.dateGrain("month", "sale_date", "monday")).toBe(
      "DATE_TRUNC('month', sale_date)",
    );
  });

  it("preserves the DuckDB schema allowlist", () => {
    expect(
      schemaAllowlist("duckdb", {
        schemas: ["main", "analytics"],
      }),
    ).toEqual(["main", "analytics"]);
  });

  it("defaults to an empty schema allowlist", () => {
    expect(schemaAllowlist("duckdb", {})).toEqual([]);
  });
});
