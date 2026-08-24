/**
 * connection.yaml scaffolds for `evidence init --warehouse <type>`.
 *
 * Templates mirror the per-warehouse schemas in
 * @evidence/core/connectors/connection-schema: required fields are written with
 * `<placeholder>` values, alternative auth methods and optional fields are
 * commented out. The result is a valid-shaped starting point the user fills in.
 *
 * Only warehouses the CLI's connection loader can actually resolve are listed
 * here (see cli/connection/load-config.ts) — keep this set in sync with it.
 */

import type { WarehouseType } from '@evidence/core/sql-dialect';

export const INIT_WAREHOUSES = [
	'snowflake',
	'bigquery',
	'clickhouse',
	'fabric',
	'databricks',
	'postgres',
	'cube',
	'motherduck'
] as const;

export type InitWarehouse = (typeof INIT_WAREHOUSES)[number];

const SNOWFLAKE_TEMPLATE = `# Snowflake direct connector. Docs: https://docs.evidence.dev/direct-connectors/snowflake
type: snowflake
account: "<account>" # e.g. xy12345.us-east-1
user: "<user>"
password: "<password>" # or private_key / private_key_path
warehouse: "<warehouse>"
database: "<database>"
# role: "<role>" # optional, applied per session
# schema sets which schemas are visible. A string makes just that schema visible:
# schema: "<schema>"
# Or pass an object to add developer schemas as preview environments:
# schema:
#   production: "<schema>"
#   devSchemas: ["<dev_schema>"]
`;

const BIGQUERY_TEMPLATE = `# BigQuery direct connector. Docs: https://docs.evidence.dev/direct-connectors/bigquery
type: bigquery
project: "<project-id>"
keyfile: ./service-account.json # or inline keyfile_json
datasets: # accessible datasets, required (at least one)
  - "<dataset>"
# location: US # default query location, optional
# dataset: "<dataset>" # default dataset for unqualified table names, optional
`;

const CLICKHOUSE_TEMPLATE = `# ClickHouse direct connector. Docs: https://docs.evidence.dev/direct-connectors/clickhouse
type: clickhouse
host: "<host>" # hostname only, no https:// — e.g. abc123.us-east-1.aws.clickhouse.cloud
username: "<username>" # optional, defaults to "default"
password: "<password>" # or use access_token instead for ClickHouse Cloud JWT
database: "<database>" # optional, defaults to "default"
# secure: true # HTTPS on port 8443 (default). For self-hosted plain HTTP set secure: false and port: 8123.
# port: 8443
# access_token: "<jwt>" # ClickHouse Cloud JWT; mutually exclusive with password
`;

const FABRIC_TEMPLATE = `# Microsoft Fabric direct connector. Docs: https://docs.evidence.dev/direct-connectors/fabric
type: fabric
server: "<server>" # SQL endpoint host, no https:// — e.g. xxxxxxxx.datawarehouse.fabric.microsoft.com
database: "<database>" # warehouse or lakehouse SQL analytics endpoint name
tenantId: "<tenant-id>" # Azure Entra tenant ID that owns the service principal
clientId: "<client-id>" # service principal application (client) ID
clientSecret: "<client-secret>" # service principal secret
# defaultSchema: dbo # schema for unqualified table names, optional
# schemas: ["<schema>"] # allowlist of schemas exposed to the schema browser, optional
# session_context: # Evidence identity → Fabric SESSION_CONTEXT key, SET per query for RLS, optional
#   - fabricContextKey: "<key>"
#     evidenceVariable: user.email
`;

const DATABRICKS_TEMPLATE = `# Databricks direct connector. Docs: https://docs.evidence.dev/direct-connectors/databricks
type: databricks
host: "<host>" # workspace hostname, no https:// — e.g. dbc-a1b2c3d4-e5f6.cloud.databricks.com
http_path: "<http-path>" # SQL Warehouse HTTP path — e.g. /sql/1.0/warehouses/abc123def456
catalog: "<catalog>" # Unity Catalog catalog
token: "<access-token>" # personal access token (dapi…), or use OAuth M2M below
# OAuth M2M (service principal) — mutually exclusive with token:
# client_id: "<client-id>"
# client_secret: "<client-secret>"
# schema: "<schema>" # schema for unqualified table names, optional (defaults to "default")
# schemas: ["<schema>"] # allowlist of schemas exposed to the schema browser, optional
# session_variables: # Evidence identity → Databricks session variable, SET per query for RLS, optional
#   - databricksVariable: "<var>"
#     evidenceVariable: user.email
`;

const POSTGRES_TEMPLATE = `# Postgres direct connector (also RDS/Aurora, Supabase, Neon, Timescale). Docs: https://docs.evidence.dev/direct-connectors/postgres
type: postgres
host: "<host>" # hostname only, no postgres:// — e.g. db.example.com or mydb.abc123.us-east-1.rds.amazonaws.com
port: 5432 # 5432 by default; Supabase poolers use 6543
user: "<user>"
password: "<password>" # for RDS IAM auth, use a freshly generated auth token
database: "<database>"
sslmode: verify-full # verify-full (secure default) | verify-ca | require (no cert check) | disable. For RDS/private CA keep verify-full + set ssl_ca_path.
# schema: public # schema for unqualified table names, optional (defaults to "public")
# schemas: ["<schema>"] # allowlist of schemas exposed to the schema browser, optional
# TLS material for verify-ca / verify-full and mutual TLS, all optional:
# ssl_ca_path: ./certs/ca.pem # PEM CA bundle (e.g. the RDS global bundle), resolved relative to connection.yaml
# ssl_cert_path: ./certs/client.crt # PEM client certificate (mutual TLS)
# ssl_key_path: ./certs/client.key # PEM client private key (mutual TLS)
`;

const CUBE_TEMPLATE = `# Cube direct connector — Cube's SQL API (Postgres-wire). Docs: https://docs.evidence.dev/direct-connectors/cube
type: cube
host: "<host>" # Cube SQL API host, hostname only — e.g. your-deployment.aws-us-east-1.cubecloudapp.dev
port: 5432 # Cube Cloud: 5432. Self-hosted: your CUBEJS_PG_SQL_PORT (often 15432)
user: "<user>" # CUBEJS_SQL_USER
password: "<password>" # CUBEJS_SQL_PASSWORD
database: "<database>" # from Cube's SQL API connection details (self-hosted accepts any value)
sslmode: verify-full # verify-full (secure default, Cube Cloud) | verify-ca | require | disable (local self-hosted, no TLS)
# schema: public # Cube exposes cubes/views in the public schema, optional
# schemas: ["<schema>"] # allowlist of schemas exposed to the schema browser, optional
# TLS material for verify-ca / verify-full and mutual TLS, all optional:
# ssl_ca_path: ./certs/ca.pem # PEM CA bundle, resolved relative to connection.yaml
# ssl_cert_path: ./certs/client.crt # PEM client certificate (mutual TLS)
# ssl_key_path: ./certs/client.key # PEM client private key (mutual TLS)
`;

const MOTHERDUCK_TEMPLATE = `# MotherDuck direct connector — queried over MotherDuck's Postgres endpoint. Docs: https://docs.evidence.dev/direct-connectors/motherduck
type: motherduck
database: "<database>" # MotherDuck database name
token: "<token>" # MotherDuck service/access token (MotherDuck UI: Settings -> Access Tokens)
# host: pg.us-east-1-aws.motherduck.com # region-specific Postgres endpoint, optional (defaults to us-east-1)
# schemas: ["<schema>"] # allowlist of schemas exposed to the schema browser, optional
`;

const TEMPLATES: Record<InitWarehouse, string> = {
	snowflake: SNOWFLAKE_TEMPLATE,
	bigquery: BIGQUERY_TEMPLATE,
	clickhouse: CLICKHOUSE_TEMPLATE,
	fabric: FABRIC_TEMPLATE,
	databricks: DATABRICKS_TEMPLATE,
	postgres: POSTGRES_TEMPLATE,
	cube: CUBE_TEMPLATE,
	motherduck: MOTHERDUCK_TEMPLATE
};

/** Returns the connection.yaml scaffold for a supported warehouse type. */
export function connectionYamlTemplate(warehouse: InitWarehouse): string {
	return TEMPLATES[warehouse];
}

/**
 * Normalize and validate a user-supplied `--warehouse` value. Returns the
 * canonical warehouse name, or null if it isn't a supported type.
 */
export function parseWarehouse(value: string): InitWarehouse | null {
	const normalized = value.trim().toLowerCase();
	return (INIT_WAREHOUSES as readonly string[]).includes(normalized)
		? (normalized as InitWarehouse)
		: null;
}

// Compile-time guard: every InitWarehouse must be a valid warehouse type.
type _AssertSubset = InitWarehouse extends WarehouseType ? true : never;
const _assert: _AssertSubset = true;
void _assert;
