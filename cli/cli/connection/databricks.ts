/**
 * Direct Databricks query execution using the credentials from connection.yaml.
 *
 * One process-cached client per unique config — sufficient for the local CLI
 * use cases (one-shot subcommands and a single-developer dev server). No RLS
 * session variables here: the CLI has no per-user identity.
 */

import { DBSQLClient } from '@databricks/sql';
import type { ConnectionOptions } from '@databricks/sql/dist/contracts/IDBSQLClient';
import { columnsFromResultSchema } from '@evidence/core/connectors/databricks/map-columns';
import { normalizeDateRows } from '@evidence/core/connectors/databricks/normalize-date-rows';
import { normalizeNumericRows } from '@evidence/core/connectors/databricks/normalize-numeric-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { DatabricksCredentials } from '@evidence/core/connectors/databricks/credentials';
import type { Column } from '@evidence/core/user-components/interfaces/query-service';
import type { QueryResult } from './types';

let cachedClient: { key: string; client: DBSQLClient } | null = null;

function configKey(c: DatabricksCredentials): string {
	const secret = c.authType === 'oauth' ? `${c.clientId}:${c.clientSecret}` : c.token;
	return [c.host, c.httpPath, c.catalog, c.schema, c.authType, secret].join('|');
}

function buildConnectionOptions(c: DatabricksCredentials): ConnectionOptions {
	const base = {
		host: c.host,
		path: c.httpPath,
		userAgentEntry: 'evidence-cli',
		preserveBigNumericPrecision: true
	};
	if (c.authType === 'oauth') {
		return {
			...base,
			authType: 'databricks-oauth',
			oauthClientId: c.clientId,
			oauthClientSecret: c.clientSecret
		};
	}
	return { ...base, token: c.token };
}

async function getClient(config: DatabricksCredentials): Promise<DBSQLClient> {
	const key = configKey(config);
	if (cachedClient?.key === key) return cachedClient.client;

	// Tear down the previous client if the config changed mid-process. Clear the
	// cache *before* reconnecting so a failed connect leaves the cache empty
	// rather than holding a stale, already-closed client.
	cachedClient?.client.close().catch(() => {});
	cachedClient = null;

	const client = new DBSQLClient();
	await client.connect(buildConnectionOptions(config));
	cachedClient = { key, client };
	return client;
}

export async function executeDatabricksQuery(
	sql: string,
	config: DatabricksCredentials
): Promise<QueryResult> {
	const client = await getClient(config);
	const session = await client.openSession({
		initialCatalog: config.catalog,
		initialSchema: config.schema
	});
	try {
		const op = await session.executeStatement(sql);
		let rows: Record<string, unknown>[];
		let columns: Column[];
		try {
			rows = (await op.fetchAll()) as Record<string, unknown>[];
			columns = columnsFromResultSchema(await op.getSchema());
		} finally {
			// Swallow close-RPC errors so a cleanup failure can't mask the fetched result.
			await op.close().catch(() => {});
		}

		const dateColumns = new Set(columns.filter((c) => c.jsType === 'date').map((c) => c.name));
		const numericColumns = new Set(columns.filter((c) => c.jsType === 'number').map((c) => c.name));
		normalizeDateRows(rows, dateColumns);
		normalizeNumericRows(rows, numericColumns);
		normalizeSparklineRows(rows, columns);

		return { rows, columns };
	} finally {
		await session.close().catch(() => {});
	}
}
