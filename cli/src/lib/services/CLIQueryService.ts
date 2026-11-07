/**
 * CLI Query Service
 * Implements the QueryService interface from @evidence/core.
 * Sends queries to the local /api/query endpoint, which routes either to a
 * local warehouse (connection.yaml) or to studio's managed query engine.
 */

import type {
	QueryService,
	QueryOpts,
	QueryResult,
	AnyRowType
} from '@evidence/core/user-components/interfaces/query-service';
import { dialectFor, type SqlDialect, type WarehouseType } from '@evidence/core/sql-dialect';

export type ConnectionType = WarehouseType | null;

export class CLIQueryService implements QueryService {
	readonly workspaceId: string;
	readonly dialect: SqlDialect;
	readonly connectionType: string;
	readonly #abandoned = new AbortController();

	constructor(workspaceId: string, connectionType: ConnectionType = null) {
		this.workspaceId = workspaceId;
		this.dialect = dialectFor(connectionType);
		this.connectionType = connectionType ?? 'managed';
	}

	/**
	 * Cancel in-flight queries and drop any later ones, for a page being left.
	 * They never settle: an empty result would render as "no data" until the
	 * page is replaced, while staying pending keeps components in their loading state.
	 */
	abandon(): void {
		this.#abandoned.abort();
	}

	async query<RowType extends AnyRowType = AnyRowType>(
		sql: string,
		opts?: QueryOpts
	): Promise<QueryResult<RowType>> {
		const abandoned = this.#abandoned.signal;
		try {
			const response = await fetch('/api/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sql }),
				signal: opts?.signal ? AbortSignal.any([opts.signal, abandoned]) : abandoned
			});

			const data = await response.json();

			if (data.error) {
				return {
					rows: [],
					columns: [],
					error: data.error
				};
			}

			return {
				rows: data.rows ?? [],
				columns: data.columns ?? [],
				error: null,
				queryDurationMs: data.queryDurationMs,
				source: data.source
			};
		} catch (e) {
			if (abandoned.aborted) return new Promise(() => {});

			// Handle abort signals gracefully
			if (e instanceof Error && e.name === 'AbortError') {
				return {
					rows: [],
					columns: [],
					error: null
				};
			}

			return {
				rows: [],
				columns: [],
				error: e instanceof Error ? e.message : 'Unknown error'
			};
		}
	}
}
