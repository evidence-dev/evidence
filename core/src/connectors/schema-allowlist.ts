import type { WarehouseMode } from './warehouse-mode';

/** The allowlist-bearing fields a connector config may carry (Studio settings or connection.yaml). */
export interface SchemaAllowlistConfig {
	datasets?: string[];
	databases?: string[];
	schemas?: string[];
	schema?: string;
}

/**
 * Schemas (BigQuery datasets, ClickHouse databases) Metadata introspects for the
 * schema browser. Shared by Studio and the CLI so both scope a connection alike.
 * Snowflake returns [] — its scope comes from Studio's schemas-as-environments picker.
 */
export function schemaAllowlist(
	mode: WarehouseMode,
	config: SchemaAllowlistConfig | null | undefined
): string[] {
	if (!config) return [];
	switch (mode) {
		case 'bigquery':
			return config.datasets ?? [];
		// Empty means "just the connection database/schema" (resolved in the metadata loader).
		case 'clickhouse':
			return config.databases ?? [];
		case 'fabric':
		case 'databricks':
		case 'motherduck':
			return config.schemas ?? [];
		// Postgres-wire: opt in to more schemas, otherwise just the default one.
		case 'postgres':
		case 'cube':
			return config.schemas?.length ? config.schemas : config.schema ? [config.schema] : [];
		default:
			return [];
	}
}
