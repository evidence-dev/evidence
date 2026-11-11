import { describe, expect, it } from "vitest";
import path from "node:path";
import { tmpdir } from "node:os";
import { duckdbConnectionSchema } from "./connection-schema";
import { resolveDuckDBCredentials } from "./resolve";

const projectDir = path.join(tmpdir(), "evidence-duckdb-project");

describe("resolveDuckDBCredentials", () => {
  it("preserves the in-memory database marker", () => {
    const config = duckdbConnectionSchema.parse({
      type: "duckdb",
    });

    const result = resolveDuckDBCredentials(config, {
      cwd: projectDir,
    });

    expect(result.database).toBe(":memory:");
  });

  it("resolves relative paths against the project directory", () => {
    const config = duckdbConnectionSchema.parse({
      type: "duckdb",
      database: "./data/analytics.duckdb",
    });

    const result = resolveDuckDBCredentials(config, {
      cwd: projectDir,
    });

    expect(result.database).toBe(
      path.join(projectDir, "data", "analytics.duckdb"),
    );
  });

  it("preserves absolute database paths", () => {
    const absolute = path.join(tmpdir(), "warehouse.duckdb");

    const config = duckdbConnectionSchema.parse({
      type: "duckdb",
      database: absolute,
    });

    const result = resolveDuckDBCredentials(config, {
      cwd: projectDir,
    });

    expect(result.database).toBe(absolute);
  });

  it("preserves the schema allowlist", () => {
    const config = duckdbConnectionSchema.parse({
      type: "duckdb",
      schemas: ["main", "analytics"],
    });

    const result = resolveDuckDBCredentials(config, {
      cwd: projectDir,
    });

    expect(result.schemas).toEqual(["main", "analytics"]);
    expect(result.schemas).not.toBe(config.schemas);
  });
});
