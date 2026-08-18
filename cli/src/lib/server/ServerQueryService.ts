/**
 * Server-side QueryService backed by `runQuery` directly (no HTTP). Used to load
 * metadata in the validate command; the client `CLIQueryService` can't be reused
 * there because its relative `/api/query` fetch has no base server-side.
 */

import type {
	QueryService,
	QueryResult,
	AnyRowType
} from '@evidence/core/user-components/interfaces/query-service';
import { dialectFor, type SqlDialect, type WarehouseType } from '@evidence/core/sql-dialect';
import { runQuery } from './run-query';

export type ConnectionType = WarehouseType | null;

export class ServerQueryService implements QueryService {
	readonly workspaceId: string;
	readonly dialect: SqlDialect;

	constructor(workspaceId: string, connectionType: ConnectionType = null) {
		this.workspaceId = workspaceId;
		this.dialect = dialectFor(connectionType);
	}

	async query<RowType extends AnyRowType = AnyRowType>(sql: string): Promise<QueryResult<RowType>> {
		const result = await runQuery(sql);
		return {
			rows: (result.rows ?? []) as RowType[],
			columns: result.columns ?? [],
			error: result.error ?? null,
			source: result.source as QueryResult['source']
		};
	}
}
