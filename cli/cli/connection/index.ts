/**
 * Direct warehouse connection from connection.yaml.
 * Single entry point: load config + execute queries.
 */

import { loadConnectionConfig } from './load-config';
import { executeSnowflakeQuery } from './snowflake';
import { executeBigQueryQuery } from './bigquery';
import { executeClickHouseQuery } from './clickhouse';
import { executeFabricQuery } from './fabric';
import { executeDatabricksQuery } from './databricks';
import { executePostgresQuery } from './postgres';
import { executeMotherduckQuery } from './motherduck';
import { managedTableNamesSql } from '@evidence/core/metadata/managed-catalog';
import type { ConnectionConfig, QueryResult } from './types';

export type { ConnectionConfig, QueryResult, QueryColumn } from './types';
export { loadConnectionConfig };

export async function executeQuery(sql: string, config: ConnectionConfig): Promise<QueryResult> {
	switch (config.type) {
		case 'snowflake':
			return executeSnowflakeQuery(sql, config);
		case 'bigquery':
			return executeBigQueryQuery(sql, config);
		case 'clickhouse':
			return executeClickHouseQuery(sql, config);
		case 'fabric':
			return executeFabricQuery(sql, config);
		case 'databricks':
			return executeDatabricksQuery(sql, config);
		case 'postgres':
			return executePostgresQuery(sql, config);
		case 'cube':
			// Cube's SQL API is Postgres-wire — reuse the Postgres executor.
			return executePostgresQuery(sql, config);
		case 'motherduck':
			return executeMotherduckQuery(sql, config);
		default:
			// Belt-and-braces: a future ConnectionConfig variant added without a
			// matching branch should fail loudly here rather than silently
			// returning Promise<undefined>.
			throw new Error(
				`Unsupported connection type: ${JSON.stringify((config as { type?: unknown }).type)}`
			);
	}
}

/**
 * Warehouse-specific catalog SQL. `tables`/`schema`/`describe` CLI commands
 * call this to avoid hard-coding `SHOW TABLES` (Snowflake-only — BigQuery
 * rejects it with "Statement not supported: ShowStatement").
 *
 * Returns rows shaped { name: string } for portability across warehouses.
 */
export function listTablesSql(config: ConnectionConfig | null): string {
	if (!config) {
		return managedTableNamesSql();
	}
	switch (config.type) {
		case 'snowflake':
			return 'SHOW TABLES';
		case 'bigquery': {
			if (!config.defaultDataset) {
				throw new Error(
					'BigQuery connection.yaml is missing `dataset:` — required to list tables. Add a default dataset, or query INFORMATION_SCHEMA directly.'
				);
			}
			// Backtick-quote project and dataset to tolerate hyphens (project IDs
			// commonly contain them) and reserved words.
			// __TABLES__ (not INFORMATION_SCHEMA.TABLES) carries row_count.
			return `SELECT table_id AS name, dataset_id AS schema_name, row_count AS rows FROM \`${config.projectId}\`.\`${config.defaultDataset}\`.__TABLES__ ORDER BY table_id`;
		}
		case 'clickhouse': {
			// Hide Evidence-internal dot-tables. An empty allowlist scopes to the
			// connection's database; a non-empty one spans exactly those databases
			// and labels each table with its database (the schema namespace).
			const dbs = config.databases ?? [];
			if (dbs.length > 0) {
				const inList = dbs.map((d) => `'${d.replace(/'/g, "''")}'`).join(', ');
				return `SELECT name, database AS schema_name, total_rows AS rows FROM system.tables WHERE database IN (${inList}) AND name NOT LIKE '.%' ORDER BY database, name`;
			}
			return `SELECT name, total_rows AS rows FROM system.tables WHERE database = currentDatabase() AND name NOT LIKE '.%' ORDER BY name`;
		}
		case 'fabric': {
			// Schema-qualify since a Fabric warehouse exposes more than dbo; SHOW TABLES is Snowflake-only.
			const base =
				"SELECT CONCAT(TABLE_SCHEMA, '.', TABLE_NAME) AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'";
			// Honour the `schemas:` allowlist (mirrors the ClickHouse `databases:` scoping).
			const schemas = config.schemas ?? [];
			if (schemas.length > 0) {
				const inList = schemas.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ');
				return `${base} AND TABLE_SCHEMA IN (${inList}) ORDER BY name`;
			}
			return `${base} ORDER BY name`;
		}
		case 'databricks': {
			// Databricks Unity Catalog INFORMATION_SCHEMA is scoped to the session
			// catalog; schema-qualify since a catalog exposes more than the default
			// schema. Honour the `schemas:` allowlist (mirrors the Fabric scoping).
			const base =
				"SELECT CONCAT(table_schema, '.', table_name) AS name FROM information_schema.tables WHERE table_schema <> 'information_schema'";
			const schemas = config.schemas ?? [];
			if (schemas.length > 0) {
				const inList = schemas.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ');
				return `${base} AND table_schema IN (${inList}) ORDER BY name`;
			}
			return `${base} ORDER BY name`;
		}
		case 'postgres': {
			// pg_catalog (not information_schema) so materialized views are included —
			// information_schema omits them. relkind: r=table, v=view, m=matview,
			// p=partitioned, f=foreign. Exclude system schemas; honour `schemas:`.
			// Tables in the default (current_schema) schema show unqualified; others
			// are qualified `schema.table`. Matches how unqualified names resolve.
			const base =
				"SELECT CASE WHEN n.nspname = current_schema() THEN c.relname ELSE n.nspname || '.' || c.relname END AS name FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind IN ('r', 'v', 'm', 'p', 'f')";
			// The `schemas` allowlist, or — when empty — just the default `schema`.
			const schemas = config.schemas?.length ? config.schemas : [config.schema];
			const inList = schemas.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ');
			return `${base} AND n.nspname IN (${inList}) ORDER BY name`;
		}
		case 'cube': {
			// Cube exposes cubes/views through information_schema (not the full
			// pg_catalog it doesn't implement). Unqualify the public schema; qualify
			// the rest — matches how unqualified names resolve.
			const base =
				"SELECT CASE WHEN table_schema = 'public' THEN table_name ELSE table_schema || '.' || table_name END AS name FROM information_schema.tables";
			const schemas = config.schemas?.length ? config.schemas : [config.schema];
			const inList = schemas.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ');
			return `${base} WHERE table_schema IN (${inList}) ORDER BY name`;
		}
		case 'motherduck': {
			// DuckDB exposes a standard information_schema. Unqualify the default 'main'
			// schema; qualify the rest — matches how unqualified names resolve. Exclude
			// the engine's own system catalogs when no `schemas:` allowlist is set.
			const base =
				"SELECT CASE WHEN table_schema = 'main' THEN table_name ELSE table_schema || '.' || table_name END AS name FROM information_schema.tables";
			const schemas = config.schemas ?? [];
			if (schemas.length > 0) {
				const inList = schemas.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ');
				return `${base} WHERE table_schema IN (${inList}) ORDER BY name`;
			}
			return `${base} WHERE table_schema NOT IN ('information_schema', 'pg_catalog') ORDER BY name`;
		}
	}
}

/**
 * Resolve a bare table name to its fully-qualified form for the active
 * warehouse. BQ requires `project.dataset.table` for unqualified queries
 * unless a default dataset is set on the job — we always qualify so the
 * `describe`/`schema` commands work regardless of session state.
 */
export function qualifyTableName(
	name: string,
	config: ConnectionConfig | null,
	schema?: string | null
): string {
	if (!config) return name;
	if (config.type === 'bigquery') {
		// If the user already passed a qualified name, leave it alone.
		if (name.includes('.') || name.includes('`')) return name;
		if (!config.defaultDataset) return name;
		return `\`${config.projectId}\`.\`${config.defaultDataset}\`.\`${name}\``;
	}
	if (config.type === 'clickhouse') {
		// With a multi-database allowlist a bare name won't resolve outside the
		// current database — qualify the probe with the table's own database.
		if (schema && !name.includes('.')) return `\`${schema}\`.\`${name}\``;
		return name;
	}
	if (config.type === 'fabric') {
		// A bare name resolves against the login's default schema, not the
		// configured `defaultSchema` — qualify it so `describe` hits the right table.
		if (name.includes('.')) return name;
		const ds = config.defaultSchema;
		if (ds) return `[${ds}].[${name}]`;
		return name;
	}
	if (config.type === 'databricks') {
		// Bare names resolve against the session schema; qualify with the
		// configured schema (Spark uses backticks) so `describe` hits the right
		// table regardless of session state.
		if (name.includes('.') || name.includes('`')) return name;
		if (config.schema) return `\`${config.schema}\`.\`${name}\``;
		return name;
	}
	if (config.type === 'postgres' || config.type === 'cube') {
		// Bare names resolve against search_path; qualify with the configured schema
		// (Postgres-wire uses double quotes) so `describe` hits the right table.
		if (name.includes('.') || name.includes('"')) return name;
		if (config.schema) return `"${config.schema}"."${name}"`;
		return name;
	}
	return name;
}
