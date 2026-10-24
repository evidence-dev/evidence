/**
 * Public entry for the SQL dialect layer. Keep this file as the single import
 * surface (`@evidence/core/sql-dialect` / `./sql-dialect`) so per-warehouse
 * implementations can be added or split without downstream import churn.
 */

export type { DialectJsType, DialectFunctionTypeRule, SqlDialect } from './sql-dialect/common';
export { escapeSqlValue, isSimpleIdentifier } from './sql-dialect/common';

export { ClickHouseDialect } from './sql-dialect/clickhouse';
export { SnowflakeDialect } from './sql-dialect/snowflake';
export { BigQueryDialect } from './sql-dialect/bigquery';
export { FabricDialect } from './sql-dialect/fabric';
export { DatabricksDialect } from './sql-dialect/databricks';
export { PostgresDialect } from './sql-dialect/postgres';
export { CubeDialect } from './sql-dialect/cube';
export { RedshiftDialect } from './sql-dialect/redshift';
export { MotherDuckDialect } from './sql-dialect/motherduck';
export { SqlServerDialect } from './sql-dialect/sqlserver';

import { ClickHouseDialect } from './sql-dialect/clickhouse';
import { SnowflakeDialect } from './sql-dialect/snowflake';
import { BigQueryDialect } from './sql-dialect/bigquery';
import { FabricDialect } from './sql-dialect/fabric';
import { DatabricksDialect } from './sql-dialect/databricks';
import { PostgresDialect } from './sql-dialect/postgres';
import { CubeDialect } from './sql-dialect/cube';
import { RedshiftDialect } from './sql-dialect/redshift';
import { MotherDuckDialect } from './sql-dialect/motherduck';
import { SqlServerDialect } from './sql-dialect/sqlserver';
import type { SqlDialect } from './sql-dialect/common';

export const defaultDialect: SqlDialect = new ClickHouseDialect();

export type WarehouseType =
	| 'snowflake'
	| 'bigquery'
	| 'clickhouse'
	| 'fabric'
	| 'databricks'
	| 'postgres'
	| 'cube'
	| 'redshift'
	| 'motherduck'
	| 'sqlserver';

export function dialectFor(type: WarehouseType | null | undefined): SqlDialect {
	switch (type) {
		case 'snowflake':
			return new SnowflakeDialect();
		case 'bigquery':
			return new BigQueryDialect();
		case 'fabric':
			return new FabricDialect();
		case 'databricks':
			return new DatabricksDialect();
		case 'postgres':
			return new PostgresDialect();
		case 'cube':
			return new CubeDialect();
		case 'redshift':
			return new RedshiftDialect();
		case 'motherduck':
			return new MotherDuckDialect();
		case 'sqlserver':
			return new SqlServerDialect();
		default:
			return new ClickHouseDialect();
	}
}
