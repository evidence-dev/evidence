/**
 * Local warehouse connection config (connection.yaml).
 *
 * Schema is dbt-shaped (single target, project-local) so dbt users can
 * largely copy-paste their existing profile. If a connection.yaml exists
 * at the project root, the CLI uses it to query the warehouse directly.
 * If absent, the CLI falls back to the managed query engine.
 */

import type { SnowflakeCredentials } from '@evidence/core/connectors/snowflake/credentials';
import type { BigQueryCredentials } from '@evidence/core/connectors/bigquery/credentials';
import type { ClickHouseCredentials } from '@evidence/core/connectors/clickhouse/credentials';
import type { FabricCredentials } from '@evidence/core/connectors/fabric/credentials';
import type { DatabricksCredentials } from '@evidence/core/connectors/databricks/credentials';
import type { PostgresCredentials } from '@evidence/core/connectors/postgres/credentials';
import type { CubeCredentials } from '@evidence/core/connectors/cube/credentials';
import type { MotherduckCredentials } from '@evidence/core/connectors/motherduck/credentials';
import type { Column } from '@evidence/core/user-components/interfaces/query-service';

export type SnowflakeConnectionConfig = { type: 'snowflake' } & SnowflakeCredentials;

export type BigQueryConnectionConfig = { type: 'bigquery' } & BigQueryCredentials;

export type ClickHouseConnectionConfig = { type: 'clickhouse' } & ClickHouseCredentials;

export type FabricConnectionConfig = { type: 'fabric' } & FabricCredentials;

export type DatabricksConnectionConfig = { type: 'databricks' } & DatabricksCredentials;

export type PostgresConnectionConfig = { type: 'postgres' } & PostgresCredentials;

// Cube's SQL API is Postgres-wire, so it shares the resolved credential shape.
export type CubeConnectionConfig = { type: 'cube' } & CubeCredentials;

export type MotherDuckConnectionConfig = { type: 'motherduck' } & MotherduckCredentials;

export type ConnectionConfig =
	| SnowflakeConnectionConfig
	| BigQueryConnectionConfig
	| ClickHouseConnectionConfig
	| FabricConnectionConfig
	| DatabricksConnectionConfig
	| PostgresConnectionConfig
	| CubeConnectionConfig
	| MotherDuckConnectionConfig;

export type QueryColumn = Column;

export interface QueryResult {
	rows: Record<string, unknown>[];
	columns: Column[];
}
