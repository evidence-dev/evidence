import type { SqlDialect } from '../sql-dialect';
import type {
	AnyRowType,
	QueryOpts,
	QueryResult
} from '../user-components/interfaces/query-service';

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
	/** Resolve by id; an unknown/omitted id falls back to the default connection. */
	get(id?: string): Connection;
}
