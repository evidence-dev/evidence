/**
 * Resolved configuration for a local DuckDB connection.
 *
 * `database` is either ':memory:' or an absolute filesystem path.
 */
export type DuckDBCredentials = {
  database: string;
  projectDir: string;
  schemas: string[];
};
