import path from "node:path";
import type { DuckDBConnection } from "./connection-schema";
import type { DuckDBCredentials } from "./credentials";

export type ResolveOpts = {
  /** Project directory containing connection.yaml. */
  cwd: string;
};

/**
 * Resolve local database paths relative to the Evidence project.
 * Preserve DuckDB's special in-memory database marker.
 */
export function resolveDuckDBCredentials(
  config: DuckDBConnection,
  opts: ResolveOpts,
): DuckDBCredentials {
  const database =
    config.database === ":memory:"
      ? ":memory:"
      : path.resolve(opts.cwd, config.database);

  return {
    database,
    schemas: [...config.schemas],
  };
}
