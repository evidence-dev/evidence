import type { QueryService } from '../user-components/interfaces/query-service';
import type { Catalog, Connection } from './types';

/**
 * Bridge the ambient single {@link QueryService} to a {@link Connection} by delegating
 * `dialect`/`query` — byte-identical to using the QueryService directly. `dialect` is a
 * getter, not a snapshot, because the studio QueryService derives it reactively from the
 * warehouse mode.
 */
export function connectionFromQueryService(
	queryService: QueryService,
	opts: { id: string; type: string }
): Connection {
	return {
		id: opts.id,
		type: opts.type,
		get dialect() {
			return queryService.dialect;
		},
		query: (sql, queryOpts) => queryService.query(sql, queryOpts)
	};
}

/** Attach a catalog, forwarding `dialect`/`query` so the live getter isn't snapshotted. */
export function withCatalog(connection: Connection, catalog: Catalog): Connection {
	return {
		id: connection.id,
		type: connection.type,
		get dialect() {
			return connection.dialect;
		},
		query: connection.query,
		get catalog() {
			return catalog;
		}
	};
}
