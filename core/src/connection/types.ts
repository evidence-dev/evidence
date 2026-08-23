import type { SqlDialect } from '../sql-dialect';
import type { Metadata } from '../metadata/Metadata.svelte';
import type {
	AnyRowType,
	QueryOpts,
	QueryResult
} from '../user-components/interfaces/query-service';

/** The schema catalog for a connection — tables/columns for validation, autocomplete, and the schema viewer. */
export type Catalog = Metadata;

/**
 * A single warehouse connection: its `dialect` (how to spell SQL) and `query` (how to
 * run it), bundled so a consumer resolves one handle rather than threading a dialect
 * and an executor that must agree. Per-connection `catalog` (metadata) comes later.
 */
export interface Connection {
	/** Stable identifier used to resolve this connection (e.g. from `data="id:table"`). */
	readonly id: string;
	/** The warehouse kind (managed, snowflake, bigquery, …). */
	readonly type: string;
	readonly dialect: SqlDialect;
	query<RowType extends AnyRowType = AnyRowType>(
		sql: string,
		opts?: QueryOpts
	): Promise<QueryResult<RowType>>;
	/** Schema catalog. Optional because it's late-bound — attached by `setMetadataContext` after the query service. */
	readonly catalog?: Catalog;
}

/**
 * The connections available on a page plus the default pointer. N-capable today even
 * though only one exists, so consumers don't change when a second lands. There is no
 * org-wide "warehouse mode" — a connection set + a default; `type` is per-connection.
 */
export interface ConnectionRegistry {
	/** The connection used when a query names none. */
	readonly default: Connection;
	/** All connections, in a stable order. */
	readonly all: readonly Connection[];
	/**
	 * Resolve by id. An omitted id resolves to `default`. An unknown id is resolved
	 * per-implementation: the registry-of-one returns its sole connection; the multi-connection
	 * registry returns an error stand-in so a mistyped connection can't silently query the default.
	 */
	get(id?: string): Connection;
}
