import type { SqlDialect } from '../../sql-dialect';

// Query service types - implementations provided by Studio or CLI

export type QueryServiceOpts = {
	session?: string;
	fetch?: typeof fetch;
};

export type QueryOpts = {
	page?: number;
	pageSize?: number;
	customFetch?: typeof fetch;
	noCache?: boolean;
	workspaceId?: string;
	wosCookie?: string;
	signal?: AbortSignal;
	// Catalog-introspection hint for server-side caching; implementations without one (CLI) ignore it.
	catalogCache?: boolean;
};

export type AnyRowType = Record<string, string | number | Date | null | undefined>;

export type Column = {
	name: string;
	clickhouseType: string;
	jsType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';
	nullable?: boolean;
};

export type QueryResult<RowType extends AnyRowType = AnyRowType> = {
	rows: RowType[];
	columns: Column[];
	error: string | null;
	queryDurationMs?: number;
	source?:
		| 'CH'
		| 'Cache'
		| 'Snowflake'
		| 'BigQuery'
		| 'Microsoft Fabric'
		| 'ClickHouse'
		| 'Databricks'
		| 'Postgres'
		| 'Cube'
		| 'MotherDuck';
};

import type { MaybeGetter } from 'runed';

// Interface that QueryService implementations must satisfy
export interface QueryService {
	readonly workspaceId: MaybeGetter<string>;
	readonly dialect: SqlDialect;
	/** The warehouse kind (managed, snowflake, bigquery, …) — the connection's `type`. */
	readonly connectionType: string;
	query<RowType extends AnyRowType = AnyRowType>(
		sql: string,
		opts?: QueryOpts
	): Promise<QueryResult<RowType>>;
	// Seed a pre-fetched result under the render-context cache key (used by PDF generation).
	primeCache?(sql: string, result: QueryResult): void;
}
