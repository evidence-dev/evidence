import { describe, it, expect } from 'vitest';
import { listTablesSql, qualifyTableName } from './index';
import type {
	BigQueryConnectionConfig,
	ClickHouseConnectionConfig,
	FabricConnectionConfig,
	SqlServerConnectionConfig,
	DatabricksConnectionConfig,
	RedshiftConnectionConfig
} from './types';

const bq = (extra: Partial<BigQueryConnectionConfig> = {}): BigQueryConnectionConfig => ({
	type: 'bigquery',
	authType: 'service_account_json',
	projectId: 'my-proj',
	serviceAccountJson: { client_email: 'a@b.c', private_key: 'k' },
	defaultDataset: 'my_dataset',
	datasets: ['my_dataset'],
	...extra
});

const ch = (databases: string[]): ClickHouseConnectionConfig => ({
	type: 'clickhouse',
	url: 'https://h:8443',
	username: 'default',
	database: 'default',
	databases
});

const fabric = (extra: Partial<FabricConnectionConfig> = {}): FabricConnectionConfig => ({
	type: 'fabric',
	server: 'abc.datawarehouse.fabric.microsoft.com',
	database: 'analytics',
	tenantId: 't',
	clientId: 'c',
	clientSecret: 's',
	...extra
});

const sqlserver = (extra: Partial<SqlServerConnectionConfig> = {}): SqlServerConnectionConfig => ({
	type: 'sqlserver',
	server: 'sql.octocorp.example',
	port: 1433,
	user: 'evidence_reader',
	password: 'pw',
	database: 'analytics',
	encrypt: true,
	trustServerCertificate: false,
	schema: 'dbo',
	...extra
});

const databricks = (extra: Partial<DatabricksConnectionConfig> = {}): DatabricksConnectionConfig =>
	({
		type: 'databricks',
		authType: 'token',
		host: 'dbc-x.cloud.databricks.com',
		httpPath: '/sql/1.0/warehouses/abc',
		catalog: 'main',
		schema: 'default',
		token: 'dapi123',
		...extra
		// The `...extra` spread widens the token/oauth discriminant; cast back.
	}) as DatabricksConnectionConfig;

describe('listTablesSql (bigquery)', () => {
	it('backtick-quotes the `rows` alias (`rows` is a reserved keyword)', () => {
		const sql = listTablesSql(bq());
		expect(sql).toContain('AS `rows`');
		expect(sql).not.toContain('AS rows');
	});
});

describe('listTablesSql (clickhouse)', () => {
	it('scopes to the current database when the allowlist is empty', () => {
		const sql = listTablesSql(ch([]));
		expect(sql).toContain('database = currentDatabase()');
		expect(sql).not.toContain('IN (');
	});

	it('spans exactly the allowlisted databases and labels each with its database', () => {
		const sql = listTablesSql(ch(['analytics', 'raw']));
		expect(sql).toContain("database IN ('analytics', 'raw')");
		expect(sql).toContain('database AS schema_name');
	});

	it('escapes single quotes in database names', () => {
		expect(listTablesSql(ch(["a'b"]))).toContain("IN ('a''b')");
	});
});

describe('qualifyTableName (clickhouse)', () => {
	it('qualifies a bare table with its database when a schema is given', () => {
		expect(qualifyTableName('orders', ch(['analytics']), 'analytics')).toBe('`analytics`.`orders`');
	});

	it('leaves the name bare when no schema is given', () => {
		expect(qualifyTableName('orders', ch([]))).toBe('orders');
	});

	it('does not double-qualify an already-qualified name', () => {
		expect(qualifyTableName('analytics.orders', ch(['analytics']), 'analytics')).toBe(
			'analytics.orders'
		);
	});
});

describe('listTablesSql (fabric)', () => {
	it('lists base tables schema-qualified from INFORMATION_SCHEMA', () => {
		const sql = listTablesSql(fabric());
		expect(sql).toContain('INFORMATION_SCHEMA.TABLES');
		expect(sql).toContain("TABLE_TYPE = 'BASE TABLE'");
		expect(sql).toContain("CONCAT(TABLE_SCHEMA, '.', TABLE_NAME)");
		expect(sql).not.toContain('TABLE_SCHEMA IN');
	});

	it('scopes to the schemas allowlist when set', () => {
		const sql = listTablesSql(fabric({ schemas: ['sales', 'raw'] }));
		expect(sql).toContain("TABLE_SCHEMA IN ('sales', 'raw')");
	});

	it('escapes single quotes in schema names', () => {
		expect(listTablesSql(fabric({ schemas: ["a'b"] }))).toContain("IN ('a''b')");
	});
});

describe('qualifyTableName (fabric)', () => {
	it('leaves an already-qualified name unchanged', () => {
		expect(qualifyTableName('dbo.orders', fabric({ defaultSchema: 'dbo' }))).toBe('dbo.orders');
	});

	it('qualifies a bare name with the configured default schema', () => {
		expect(qualifyTableName('orders', fabric({ defaultSchema: 'sales' }))).toBe('[sales].[orders]');
	});

	it('leaves a bare name unqualified when no default schema is set', () => {
		expect(qualifyTableName('orders', fabric())).toBe('orders');
	});
});

describe('listTablesSql (databricks)', () => {
	it('lists tables schema-qualified from information_schema, excluding information_schema', () => {
		const sql = listTablesSql(databricks());
		expect(sql).toContain('information_schema.tables');
		expect(sql).toContain("CONCAT(table_schema, '.', table_name)");
		expect(sql).toContain("table_schema <> 'information_schema'");
		expect(sql).not.toContain('table_schema IN');
	});

	it('scopes to the schemas allowlist when set', () => {
		const sql = listTablesSql(databricks({ schemas: ['sales', 'raw'] }));
		expect(sql).toContain("table_schema IN ('sales', 'raw')");
	});

	it('escapes single quotes in schema names', () => {
		expect(listTablesSql(databricks({ schemas: ["a'b"] }))).toContain("IN ('a''b')");
	});
});

describe('qualifyTableName (databricks)', () => {
	it('qualifies a bare name with the configured schema using backticks', () => {
		expect(qualifyTableName('orders', databricks({ schema: 'sales' }))).toBe('`sales`.`orders`');
	});

	it('leaves an already-qualified name unchanged', () => {
		expect(qualifyTableName('sales.orders', databricks({ schema: 'sales' }))).toBe('sales.orders');
	});
});

describe('listTablesSql (sqlserver)', () => {
	it('lists base tables schema-qualified from INFORMATION_SCHEMA', () => {
		const sql = listTablesSql(sqlserver());
		expect(sql).toContain('INFORMATION_SCHEMA.TABLES');
		expect(sql).toContain("CONCAT(TABLE_SCHEMA, '.', TABLE_NAME)");
		expect(sql).not.toContain('TABLE_SCHEMA IN');
	});

	it('scopes to the schemas allowlist and escapes quotes', () => {
		expect(listTablesSql(sqlserver({ schemas: ['sales', "a'b"] }))).toContain(
			"TABLE_SCHEMA IN ('sales', 'a''b')"
		);
	});
});

const redshift = (extra: Partial<RedshiftConnectionConfig> = {}): RedshiftConnectionConfig => ({
	type: 'redshift',
	host: 'my-cluster.abc123.us-east-1.redshift.amazonaws.com',
	port: 5439,
	user: 'evidence_reader',
	password: 'pw',
	database: 'dev',
	schema: 'public',
	ssl: { mode: 'verify-full' },
	...extra
});

describe('listTablesSql (redshift)', () => {
	// current_schema() is leader-node-only and errors in any statement that also
	// reads an SVV view, so the default schema must be a literal.
	it('reads svv_tables without calling current_schema()', () => {
		const sql = listTablesSql(redshift());
		expect(sql).toContain('FROM svv_tables');
		expect(sql).not.toContain('current_schema()');
	});

	it('unqualifies tables in the configured schema and scopes to it when no allowlist is set', () => {
		const sql = listTablesSql(redshift({ schema: 'analytics' }));
		expect(sql).toContain("CASE WHEN table_schema = 'analytics' AND");
		expect(sql).toContain("table_schema IN ('analytics')");
	});

	it('scopes to the schemas allowlist and doubles quotes', () => {
		const sql = listTablesSql(redshift({ schema: 'public', schemas: ['sales', "a'b"] }));
		expect(sql).toContain("table_schema IN ('sales', 'a''b')");
	});

	it('always qualifies external tables and hides mv_tbl__ backing tables', () => {
		const sql = listTablesSql(redshift());
		expect(sql).toContain("AND table_type <> 'EXTERNAL TABLE' THEN table_name");
		expect(sql).toContain("LEFT(table_name, 8) <> 'mv_tbl__'");
		// No LIKE: Redshift's LIKE escape-character semantics differ from Postgres.
		expect(sql).not.toMatch(/\bLIKE\b/);
	});
});

describe('qualifyTableName (sqlserver)', () => {
	it('qualifies a bare name with the default dbo schema', () => {
		expect(qualifyTableName('orders', sqlserver())).toBe('[dbo].[orders]');
	});

	it('qualifies a bare name with a configured schema', () => {
		expect(qualifyTableName('orders', sqlserver({ schema: 'sales' }))).toBe('[sales].[orders]');
	});

	it('leaves an already-qualified name unchanged', () => {
		expect(qualifyTableName('sales.orders', sqlserver())).toBe('sales.orders');
	});
});
