import { toast } from 'svelte-sonner';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import {
	getClickHouseToJsType,
	cleanClickHouseType
} from '../user-components/common/typeConversions';
import { getSnowflakeToJsType } from '../connectors/snowflake/type-mapping';
import { getBigQueryToJsType } from '../connectors/bigquery/type-mapping';
import { getFabricToJsType } from '../connectors/fabric/type-mapping';
import { getDatabricksToJsType } from '../connectors/databricks/type-mapping';
import { getPostgresToJsType } from '../connectors/postgres/type-mapping';
import { getMotherduckToJsType } from '../connectors/motherduck/type-mapping';
import { TableMetadata } from './TableMetadata.svelte';
import { groupColumnsByTable } from './group-columns';
import {
	managedColumnsSql,
	managedViewsSql,
	managedModelsSql,
	NO_QUERY_CACHE
} from './managed-catalog';
import type { IMetadata } from './metadata';
import type {
	QueryService,
	AnyRowType,
	QueryResult
} from '../user-components/interfaces/query-service';
import { extract, watch, type MaybeGetter } from 'runed';
import pRetry, { AbortError } from 'p-retry';
import { logger } from '../shims/logger';
import type { WarehouseMode } from '../connectors/warehouse-mode';

// Default client-side wait for a catalog scan. Kept short for server/AI contexts
// (validation, list_tables) that await the catalog and should degrade rather than
// block. The interactive editor overrides this via `catalogTimeoutMs` — the abort is
// never forwarded to the warehouse, so a short client budget doesn't cancel or speed
// up the scan (it runs to completion server-side and caches regardless); it only
// decides whether the client sees success or a self-inflicted timeout error.
const DEFAULT_CATALOG_QUERY_TIMEOUT_MS = 15_000;
const CATALOG_QUERY_RETRIES = 2;

// After a cold-miss timeout the server keeps scanning and warms its cache; these
// silent retries pick that up so the schema panel self-heals instead of surfacing an
// error on a routine load. Bounded — a very slow (90s+) scan still needs a manual
// retry until the catalog is served from a durable store.
const CATALOG_REVALIDATE_DELAYS_MS = [15_000, 45_000];

export type MetadataOpts = {
	// Getters so a persistent layout that swaps orgs (without a full reload)
	// re-introspects against the new org's warehouse instead of the old mode.
	warehouseMode?: MaybeGetter<WarehouseMode>;
	schemaAllowlist?: MaybeGetter<string[]>;
	/**
	 * True when the warehouse is fully configured (secret saved). When false
	 * and warehouseMode is snowflake/bigquery, the loader skips introspection
	 * silently — the org has selected a native warehouse but not yet connected
	 * it, so 400ing on every layout mount is just noise.
	 */
	warehouseConfigured?: MaybeGetter<boolean>;
	/**
	 * Client-side timeout for a catalog scan (ms). Defaults to a short fast-fail
	 * (server/AI contexts degrade rather than block). The interactive editor sets
	 * this high so a slow-but-successful scan (Snowflake p90 ~40s) completes inline
	 * instead of surfacing a timeout error — the load is non-blocking, so a longer
	 * wait just keeps the schema-panel skeleton up.
	 */
	catalogTimeoutMs?: MaybeGetter<number>;
};

export class Metadata {
	get tables() {
		return [...this.#tables.values()];
	}

	get loading() {
		return this.#loading;
	}

	// Last load() threw (e.g. catalog timeout); distinct from loaded-but-empty so validators don't assert "table missing".
	get loadFailed() {
		return this.#loadFailed;
	}

	#tables = new SvelteMap<string, TableMetadata>();

	#loading = $state(true);

	#loadFailed = $state(false);

	// Bumped each load(); a superseded in-flight load checks this before writing terminal state.
	#loadGeneration = 0;

	#revalidateTimer: ReturnType<typeof setTimeout> | undefined;

	#revalidateAttempts = 0;

	#queryService: QueryService;

	#warehouseModeSource: MaybeGetter<WarehouseMode>;

	#schemaAllowlistSource: MaybeGetter<string[]>;

	#warehouseConfiguredSource: MaybeGetter<boolean>;

	#catalogTimeoutSource: MaybeGetter<number>;

	// Read at load() time so an org swap under a persistent layout picks up the
	// new org's values rather than the ones captured at construction.
	get #warehouseMode(): WarehouseMode {
		return extract(this.#warehouseModeSource) ?? 'managed';
	}

	get #schemaAllowlist(): string[] {
		return extract(this.#schemaAllowlistSource) ?? [];
	}

	get #warehouseConfigured(): boolean {
		return extract(this.#warehouseConfiguredSource) ?? true;
	}

	get #catalogTimeoutMs(): number {
		return extract(this.#catalogTimeoutSource) ?? DEFAULT_CATALOG_QUERY_TIMEOUT_MS;
	}

	constructor(queryService: QueryService, opts?: MetadataOpts) {
		this.#queryService = queryService;
		this.#warehouseModeSource = opts?.warehouseMode ?? 'managed';
		this.#schemaAllowlistSource = opts?.schemaAllowlist ?? [];
		this.#warehouseConfiguredSource = opts?.warehouseConfigured ?? true;
		this.#catalogTimeoutSource = opts?.catalogTimeoutMs ?? DEFAULT_CATALOG_QUERY_TIMEOUT_MS;

		watch(
			() => extract(this.#queryService.workspaceId),
			() => {
				// Failures surface via loadFailed + a toast; swallow the rejection so a
				// cold-miss timeout doesn't become an unhandled promise rejection.
				void this.load().catch(() => {});
			}
		);
	}

	/**
	 * Case-sensitivity default for TableMetadata instances we build. Centralised
	 * here so every construction site picks it up from the active dialect.
	 */
	get #tableOpts() {
		return { caseInsensitive: this.#queryService.dialect.caseInsensitiveIdentifiers };
	}

	getTable(name: string): TableMetadata | undefined {
		const exact = this.#tables.get(name);
		if (exact) return exact;

		// Snowflake-style case-folding: `public.orders` should find `PUBLIC.ORDERS`
		// in metadata. Only scan on dialects that case-fold unquoted identifiers
		// so ClickHouse behaviour is unchanged.
		if (!this.#queryService.dialect.caseInsensitiveIdentifiers) return undefined;

		const upper = name.toUpperCase();
		for (const [key, table] of this.#tables) {
			if (key.toUpperCase() === upper) return table;
		}
		return undefined;
	}

	protected addTableMetadata(table: TableMetadata): void {
		this.#tables.set(table.name, table);
	}

	protected removeTableMetadata(name: string): void {
		this.#tables.delete(name);
	}

	protected getQueryService(): QueryService {
		return this.#queryService;
	}

	get dialect() {
		return this.#queryService.dialect;
	}

	async load(): Promise<void> {
		const generation = ++this.#loadGeneration;
		// A fresh load supersedes any pending silent revalidation.
		clearTimeout(this.#revalidateTimer);
		this.#revalidateTimer = undefined;
		this.#loading = true;
		this.#loadFailed = false;
		// Snapshot so a failing reload can fall back to the last-known catalog instead
		// of blanking the schema panel while the server keeps warming its cache.
		const lastKnown = new Map(this.#tables);
		this.#tables.clear();
		try {
			await this.#dispatchLoad();
			this.#revalidateAttempts = 0;
		} catch (e) {
			// A slower earlier load that fails after a newer load already succeeded
			// must not flip loadFailed back on over a populated catalog.
			if (generation === this.#loadGeneration) {
				this.#loadFailed = true;
				if (this.#tables.size === 0 && lastKnown.size > 0) {
					for (const [name, table] of lastKnown) this.#tables.set(name, table);
				}
				// Cold start with nothing to show: deliberately surface NO toast. Keep the
				// loading state up and silently retry to catch the server-warmed cache;
				// consumers see the failure passively via loadFailed once retries run out.
				if (
					this.#tables.size === 0 &&
					this.#revalidateAttempts < CATALOG_REVALIDATE_DELAYS_MS.length
				) {
					const delay = CATALOG_REVALIDATE_DELAYS_MS[this.#revalidateAttempts++];
					this.#loading = true;
					const timer = setTimeout(() => {
						void this.load().catch(() => {});
					}, delay);
					// Don't let a background revalidation keep a Node process (tests) alive.
					(timer as unknown as { unref?: () => void }).unref?.();
					this.#revalidateTimer = timer;
				}
			}
			throw e;
		}
	}

	async #dispatchLoad(): Promise<void> {
		// Org picked a native warehouse but hasn't saved credentials yet — every
		// query would 400. Skip silently so the connectors page can render
		// without a "Failed to load schema" toast.
		if (
			!this.#warehouseConfigured &&
			(this.#warehouseMode === 'snowflake' ||
				this.#warehouseMode === 'bigquery' ||
				this.#warehouseMode === 'fabric' ||
				this.#warehouseMode === 'clickhouse' ||
				this.#warehouseMode === 'databricks' ||
				this.#warehouseMode === 'postgres' ||
				this.#warehouseMode === 'cube' ||
				this.#warehouseMode === 'motherduck')
		) {
			this.#loading = false;
			return;
		}

		if (this.#warehouseMode === 'snowflake') {
			return await this.#loadSnowflake();
		}

		if (this.#warehouseMode === 'bigquery') {
			return await this.#loadBigQuery();
		}

		if (this.#warehouseMode === 'fabric') {
			return await this.#loadFabric();
		}

		if (this.#warehouseMode === 'clickhouse') {
			return await this.#loadClickHouse();
		}

		if (this.#warehouseMode === 'databricks') {
			return await this.#loadDatabricks();
		}

		if (this.#warehouseMode === 'postgres') {
			return await this.#loadPostgres();
		}

		if (this.#warehouseMode === 'cube') {
			return await this.#loadCube();
		}

		if (this.#warehouseMode === 'motherduck') {
			return this.#loadMotherduck();
		}

		try {
			// filter out clickhouse table by removing the table starting with .
			const [tableColumnsResult, viewTablesResult, modelTablesResults] = await Promise.all([
				pRetry(
					() =>
						this.#queryService.query<{
							tableName: string;
							columnName: string;
							columnType: string;
						}>(`${managedColumnsSql()} ${NO_QUERY_CACHE}`, { noCache: true }),
					{ retries: 4 }
				),
				// Get list of views to distinguish them from regular tables
				pRetry(
					() =>
						this.#queryService.query<{ name: string }>(`${managedViewsSql()} ${NO_QUERY_CACHE}`, {
							noCache: true
						}),
					{ retries: 4 }
				),
				pRetry(
					() =>
						this.#queryService.query<{ name: string }>(`${managedModelsSql()} ${NO_QUERY_CACHE}`, {
							noCache: true
						}),
					{ retries: 4 }
				)
			]);

			if (tableColumnsResult.error) {
				logger.error({ tableColumnsResult }, 'Failed to fetch organization metadata');
				throw new Error(`Failed to fetch organization metadata: ${tableColumnsResult.error}`);
			}

			// Create a set of view names and model names
			const viewNamesArray = viewTablesResult.error
				? []
				: viewTablesResult.rows.map((row) => row.name);
			const viewNamesSet = new SvelteSet(viewNamesArray);

			const modelsNamesArray = modelTablesResults.error
				? []
				: modelTablesResults.rows.map((row) => row.name);
			const modelsNamesSet = new SvelteSet(modelsNamesArray);

			const columnsByTable = groupColumnsByTable(
				tableColumnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: cleanClickHouseType(columnType),
					jsType: getClickHouseToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							// A view is only a model when it's also in the models table; anything
							// that isn't a view is a plain table.
							tableType:
								viewNamesSet.has(tableName) && modelsNamesSet.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch organization metadata');
			throw new Error(`Failed to fetch organization metadata`, { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	// Never retries a timeout (that would stack more long scans onto the pool); resolves error-shaped so callers keep the `.error` contract.
	async #catalogQuery<RowType extends AnyRowType>(sql: string): Promise<QueryResult<RowType>> {
		const timeoutMs = this.#catalogTimeoutMs;
		try {
			return await pRetry(
				async () => {
					const controller = new AbortController();
					const timer = setTimeout(() => controller.abort(), timeoutMs);
					try {
						const result = await this.#queryService.query<RowType>(sql, {
							noCache: true,
							catalogCache: true,
							signal: controller.signal
						});
						// Snapshot before inspecting the result so a timer firing mid-check
						// can't reclassify a genuine error as a non-retryable timeout.
						const timedOut = controller.signal.aborted;
						if (result.error) {
							if (timedOut) {
								throw new AbortError(`Catalog query timed out after ${timeoutMs}ms`);
							}
							throw new Error(result.error);
						}
						return result;
					} finally {
						clearTimeout(timer);
					}
				},
				{ retries: CATALOG_QUERY_RETRIES }
			);
		} catch (e) {
			return { rows: [], columns: [], error: e instanceof Error ? e.message : String(e) };
		}
	}

	async #loadSnowflake(): Promise<void> {
		try {
			const schemaFilter =
				this.#schemaAllowlist.length > 0
					? `WHERE TABLE_SCHEMA IN (${this.#schemaAllowlist.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')})`
					: `WHERE TABLE_SCHEMA <> 'INFORMATION_SCHEMA'`;

			const [columnsResult, viewsResult] = await Promise.all([
				this.#catalogQuery<{
					tableName: string;
					columnName: string;
					columnType: string;
				}>(
					`SELECT TABLE_SCHEMA || '.' || TABLE_NAME as "tableName",
       COLUMN_NAME as "columnName",
       DATA_TYPE as "columnType"
FROM INFORMATION_SCHEMA.COLUMNS
${schemaFilter}
ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION`
				),
				this.#catalogQuery<{ name: string }>(
					`SELECT TABLE_SCHEMA || '.' || TABLE_NAME as "name"
FROM INFORMATION_SCHEMA.VIEWS
${schemaFilter}`
				)
			]);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch Snowflake metadata');
				throw new Error(`Failed to fetch Snowflake metadata: ${columnsResult.error}`);
			}

			const viewNames = new SvelteSet(viewsResult.error ? [] : viewsResult.rows.map((r) => r.name));

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: columnType,
					jsType: getSnowflakeToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: viewNames.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch Snowflake metadata');
			throw new Error('Failed to fetch Snowflake metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	async #loadFabric(): Promise<void> {
		try {
			// Fabric is T-SQL: INFORMATION_SCHEMA.COLUMNS / .VIEWS (no `system.columns`),
			// string concat via CONCAT (not `||`), and double-quoted column aliases
			// (valid with QUOTED_IDENTIFIER ON, the default).
			const schemaFilter =
				this.#schemaAllowlist.length > 0
					? `WHERE TABLE_SCHEMA IN (${this.#schemaAllowlist.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')})`
					: `WHERE TABLE_SCHEMA NOT IN ('INFORMATION_SCHEMA', 'sys')`;

			const [columnsResult, viewsResult] = await Promise.all([
				this.#catalogQuery<{
					tableName: string;
					columnName: string;
					columnType: string;
				}>(
					`SELECT CONCAT(TABLE_SCHEMA, '.', TABLE_NAME) as "tableName",
       COLUMN_NAME as "columnName",
       DATA_TYPE as "columnType"
FROM INFORMATION_SCHEMA.COLUMNS
${schemaFilter}
ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION`
				),
				this.#catalogQuery<{ name: string }>(
					`SELECT CONCAT(TABLE_SCHEMA, '.', TABLE_NAME) as "name"
FROM INFORMATION_SCHEMA.VIEWS
${schemaFilter}`
				)
			]);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch Microsoft Fabric metadata');
				throw new Error(`Failed to fetch Microsoft Fabric metadata: ${columnsResult.error}`);
			}

			const viewNames = new SvelteSet(viewsResult.error ? [] : viewsResult.rows.map((r) => r.name));

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: columnType,
					jsType: getFabricToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: viewNames.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch Microsoft Fabric metadata');
			throw new Error('Failed to fetch Microsoft Fabric metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	async #loadDatabricks(): Promise<void> {
		try {
			// Databricks Unity Catalog exposes INFORMATION_SCHEMA.COLUMNS / .VIEWS
			// scoped to the session catalog. Spark uses backticks for identifier
			// quoting (double quotes are string literals in ANSI mode), so column
			// aliases are backticked.
			const schemaFilter =
				this.#schemaAllowlist.length > 0
					? `WHERE table_schema IN (${this.#schemaAllowlist.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')})`
					: `WHERE table_schema <> 'information_schema'`;

			const [columnsResult, viewsResult] = await Promise.all([
				this.#catalogQuery<{
					tableName: string;
					columnName: string;
					columnType: string;
				}>(
					`SELECT CONCAT(table_schema, '.', table_name) AS \`tableName\`,
       column_name AS \`columnName\`,
       data_type AS \`columnType\`
FROM information_schema.columns
${schemaFilter}
ORDER BY table_schema, table_name, ordinal_position`
				),
				this.#catalogQuery<{ name: string }>(
					`SELECT CONCAT(table_schema, '.', table_name) AS \`name\`
FROM information_schema.views
${schemaFilter}`
				)
			]);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch Databricks metadata');
				throw new Error(`Failed to fetch Databricks metadata: ${columnsResult.error}`);
			}

			const viewNames = new SvelteSet(viewsResult.error ? [] : viewsResult.rows.map((r) => r.name));

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: columnType,
					jsType: getDatabricksToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: viewNames.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch Databricks metadata');
			throw new Error('Failed to fetch Databricks metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	async #loadMotherduck(): Promise<void> {
		try {
			// DuckDB exposes a standard `information_schema`. String concat is `||`,
			// and double-quoted column aliases are valid. Exclude the engine's own
			// system catalogs when no explicit allowlist is configured.
			const schemaFilter =
				this.#schemaAllowlist.length > 0
					? `WHERE table_schema IN (${this.#schemaAllowlist.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')})`
					: `WHERE table_schema NOT IN ('information_schema', 'pg_catalog')`;

			const [columnsResult, viewsResult] = await Promise.all([
				this.#catalogQuery<{
					tableName: string;
					columnName: string;
					columnType: string;
				}>(
					`SELECT table_schema || '.' || table_name as "tableName",
       column_name as "columnName",
       data_type as "columnType"
FROM information_schema.columns
${schemaFilter}
ORDER BY table_schema, table_name, ordinal_position`
				),
				this.#catalogQuery<{ name: string }>(
					`SELECT table_schema || '.' || table_name as "name"
FROM information_schema.views
${schemaFilter}`
				)
			]);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch MotherDuck metadata');
				throw new Error(`Failed to fetch MotherDuck metadata: ${columnsResult.error}`);
			}

			const viewNames = new SvelteSet(viewsResult.error ? [] : viewsResult.rows.map((r) => r.name));

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: columnType,
					jsType: getMotherduckToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: viewNames.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch MotherDuck metadata');
			throw new Error('Failed to fetch MotherDuck metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	async #loadPostgres(): Promise<void> {
		try {
			// Introspect via pg_catalog (not information_schema) so materialized views
			// are included — information_schema omits them. relkind: r=table, v=view,
			// m=matview, p=partitioned table, f=foreign table. Views + matviews surface
			// as 'model'; the rest as 'table'.
			const schemaFilter =
				this.#schemaAllowlist.length > 0
					? `AND n.nspname IN (${this.#schemaAllowlist.map((sc) => `'${sc.replace(/'/g, "''")}'`).join(', ')})`
					: `AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'`;

			const columnsResult = await this.#catalogQuery<{
				tableName: string;
				columnName: string;
				columnType: string;
				relKind: string;
			}>(
				`SELECT CASE WHEN n.nspname = current_schema() THEN c.relname ELSE n.nspname || '.' || c.relname END AS "tableName",
       a.attname AS "columnName",
       format_type(a.atttypid, a.atttypmod) AS "columnType",
       c.relkind AS "relKind"
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
WHERE c.relkind IN ('r', 'v', 'm', 'p', 'f')
  AND a.attnum > 0
  AND NOT a.attisdropped
  ${schemaFilter}
ORDER BY n.nspname, c.relname, a.attnum`
			);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch Postgres metadata');
				throw new Error(`Failed to fetch Postgres metadata: ${columnsResult.error}`);
			}

			// Views ('v') and materialized views ('m') are shown as models.
			const modelNames = new SvelteSet(
				columnsResult.rows
					.filter((r) => r.relKind === 'v' || r.relKind === 'm')
					.map((r) => r.tableName)
			);

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: columnType,
					jsType: getPostgresToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: modelNames.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch Postgres metadata');
			throw new Error('Failed to fetch Postgres metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	async #loadCube(): Promise<void> {
		try {
			// Cube's SQL API exposes cubes and views as tables through information_schema
			// (the surface BI tools introspect), NOT the full pg_catalog/relkind path
			// Postgres uses — Cube doesn't implement matviews or partitioned/foreign
			// relations. Cube publishes everything under the `public` schema, so unqualify
			// it and qualify anything else. Both cubes AND Cube "views" report
			// table_type='BASE TABLE' in Cube's information_schema (only the meta-tables are
			// 'VIEW'), so table_type can't distinguish them — everything is a 'table' here.
			// The real cube-vs-view signal is Cube's /meta REST endpoint, not the SQL API.
			const schemaFilter =
				this.#schemaAllowlist.length > 0
					? `AND c.table_schema IN (${this.#schemaAllowlist.map((sc) => `'${sc.replace(/'/g, "''")}'`).join(', ')})`
					: `AND c.table_schema NOT IN ('information_schema', 'pg_catalog')`;

			const columnsResult = await this.#catalogQuery<{
				tableName: string;
				columnName: string;
				columnType: string;
			}>(
				`SELECT CASE WHEN c.table_schema = 'public' THEN c.table_name ELSE c.table_schema || '.' || c.table_name END AS "tableName",
       c.column_name AS "columnName",
       c.data_type AS "columnType"
FROM information_schema.columns c
WHERE TRUE
  ${schemaFilter}
ORDER BY c.table_schema, c.table_name, c.ordinal_position`
			);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch Cube metadata');
				throw new Error(`Failed to fetch Cube metadata: ${columnsResult.error}`);
			}

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: columnType,
					jsType: getPostgresToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch Cube metadata');
			throw new Error('Failed to fetch Cube metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	async #loadClickHouse(): Promise<void> {
		try {
			// A customer's OWN ClickHouse — introspect system.columns / system.tables
			// scoped to their database(s). Deliberately NOT the managed-catalog.ts
			// path: no Evidence `demo`/`evidence` scopes and no Evidence "model"
			// detection. Tables are qualified `database.table`, consistent with the
			// other native warehouses; an empty allowlist scopes to the connection's
			// database via currentDatabase(). ('model' is just the schema browser's
			// tableType for views here, not Evidence's dbt-model concept.)
			const dbFilter =
				this.#schemaAllowlist.length > 0
					? `database IN (${this.#schemaAllowlist.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')})`
					: `database = currentDatabase()`;

			const [columnsResult, viewsResult] = await Promise.all([
				this.#catalogQuery<{
					tableName: string;
					columnName: string;
					columnType: string;
				}>(
					`SELECT concat(database, '.', table) AS tableName,
       name AS columnName,
       type AS columnType
FROM system.columns
WHERE ${dbFilter} AND table NOT LIKE '.%'
ORDER BY database, table, position`
				),
				this.#catalogQuery<{ name: string }>(
					`SELECT concat(database, '.', name) AS name
FROM system.tables
WHERE ${dbFilter} AND engine LIKE '%View%'`
				)
			]);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch ClickHouse metadata');
				throw new Error(`Failed to fetch ClickHouse metadata: ${columnsResult.error}`);
			}

			const viewNames = new SvelteSet(viewsResult.error ? [] : viewsResult.rows.map((r) => r.name));

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => row.tableName,
				({ columnName, columnType }) => ({
					name: columnName,
					type: cleanClickHouseType(columnType),
					jsType: getClickHouseToJsType(columnType)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: viewNames.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch ClickHouse metadata');
			throw new Error('Failed to fetch ClickHouse metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	async #loadBigQuery(): Promise<void> {
		try {
			// BigQuery's INFORMATION_SCHEMA is per-dataset (or `region-*` with
			// elevated perms). We require an explicit datasets allowlist and fan
			// out per-dataset — much cheaper, and matches what the user opted in
			// to in the connectors UI.
			if (this.#schemaAllowlist.length === 0) {
				const title = 'No BigQuery datasets configured';
				if (!toast.getActiveToasts().find((t) => t.title === title)) {
					toast.error(title, {
						description:
							'Add at least one dataset to your warehouse settings to enable schema introspection.',
						duration: Infinity
					});
				}
				return;
			}

			const escapeIdent = (s: string) => '`' + s.replace(/`/g, '\\`') + '`';
			const columnsUnion = this.#schemaAllowlist
				.map(
					(dataset) =>
						`SELECT '${dataset.replace(/'/g, "''")}' AS table_schema, table_name, column_name, data_type, ordinal_position
FROM ${escapeIdent(dataset)}.INFORMATION_SCHEMA.COLUMNS`
				)
				.join('\nUNION ALL\n');

			const viewsUnion = this.#schemaAllowlist
				.map(
					(dataset) =>
						`SELECT '${dataset.replace(/'/g, "''")}' AS table_schema, table_name
FROM ${escapeIdent(dataset)}.INFORMATION_SCHEMA.TABLES
WHERE table_type = 'VIEW'`
				)
				.join('\nUNION ALL\n');

			const [columnsResult, viewsResult] = await Promise.all([
				this.#catalogQuery<{
					table_schema: string;
					table_name: string;
					column_name: string;
					data_type: string;
				}>(`${columnsUnion}\nORDER BY table_schema, table_name, ordinal_position`),
				this.#catalogQuery<{ table_schema: string; table_name: string }>(viewsUnion)
			]);

			if (columnsResult.error) {
				logger.error({ columnsResult }, 'Failed to fetch BigQuery metadata');
				throw new Error(`Failed to fetch BigQuery metadata: ${columnsResult.error}`);
			}

			const viewNames = new SvelteSet(
				viewsResult.error ? [] : viewsResult.rows.map((r) => `${r.table_schema}.${r.table_name}`)
			);

			const columnsByTable = groupColumnsByTable(
				columnsResult.rows,
				(row) => `${row.table_schema}.${row.table_name}`,
				({ column_name, data_type }) => ({
					name: column_name,
					type: data_type,
					jsType: getBigQueryToJsType(data_type)
				})
			);

			for (const [tableName, columns] of columnsByTable) {
				this.#tables.set(
					tableName,
					new TableMetadata(
						{
							name: tableName,
							columns,
							tableType: viewNames.has(tableName) ? 'model' : 'table'
						},
						this.#tableOpts
					)
				);
			}
		} catch (e) {
			logger.error(e, 'Failed to fetch BigQuery metadata');
			throw new Error('Failed to fetch BigQuery metadata', { cause: e });
		} finally {
			this.#loading = false;
		}
	}

	toJSON(): IMetadata {
		return {
			tables: Object.fromEntries(
				this.#tables.entries().map(([name, table]) => [name, table.toJSON()])
			)
		};
	}
}
