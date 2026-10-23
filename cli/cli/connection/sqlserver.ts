// Direct SQL Server / Azure SQL (T-SQL, SQL-login auth) query execution from connection.yaml.

import sql from 'mssql';
import { mapMssqlColumns } from '@evidence/core/connectors/mssql/map-columns';
import { normalizeDateRows } from '@evidence/core/connectors/mssql/normalize-date-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { SqlServerCredentials } from '@evidence/core/connectors/sqlserver/credentials';
import type { QueryColumn, QueryResult } from './types';

// `pending` dedups concurrent first callers onto one pool build.
let cached: { key: string; pool: sql.ConnectionPool } | null = null;
let pending: { key: string; promise: Promise<sql.ConnectionPool> } | null = null;

function configKey(c: SqlServerCredentials): string {
	// Secrets + CA included so rotating them invalidates the cache (not a security boundary).
	return JSON.stringify([
		c.server,
		c.port,
		c.user,
		c.password,
		c.database,
		c.encrypt,
		c.trustServerCertificate,
		c.ca ?? ''
	]);
}

function buildConfig(c: SqlServerCredentials): sql.config {
	return {
		server: c.server,
		database: c.database,
		port: c.port,
		authentication: { type: 'default', options: { userName: c.user, password: c.password } },
		options: {
			encrypt: c.encrypt,
			trustServerCertificate: c.trustServerCertificate,
			useUTC: true,
			...(c.ca ? { cryptoCredentialsDetails: { ca: c.ca } } : {})
		},
		pool: { min: 0, max: 5, idleTimeoutMillis: 5 * 60_000 },
		connectionTimeout: 30_000,
		requestTimeout: 120_000
	};
}

async function getPool(config: SqlServerCredentials): Promise<sql.ConnectionPool> {
	const key = configKey(config);
	if (cached?.key === key) return cached.pool;
	if (pending?.key === key) return pending.promise;

	const stale = cached;
	const promise = (async () => {
		try {
			if (stale) {
				cached = null;
				stale.pool.close().catch(() => {});
			}
			const pool = new sql.ConnectionPool(buildConfig(config));
			await pool.connect();
			cached = { key, pool };
			return pool;
		} finally {
			if (pending?.key === key) pending = null;
		}
	})();
	pending = { key, promise };
	return promise;
}

export async function executeSqlServerQuery(
	sqlText: string,
	config: SqlServerCredentials
): Promise<QueryResult> {
	const pool = await getPool(config);

	let rows: Record<string, unknown>[];
	let columns: QueryColumn[];
	try {
		const result = await pool.request().query(sqlText);
		rows = (result.recordset as unknown as Record<string, unknown>[]) ?? [];
		columns = mapMssqlColumns(result.recordset?.columns);
	} catch (e) {
		throw new Error(e instanceof Error ? e.message : 'SQL Server query failed');
	}

	const dateColumns = new Set(columns.filter((c) => c.jsType === 'date').map((c) => c.name));
	normalizeDateRows(rows, dateColumns);
	normalizeSparklineRows(rows, columns);

	return { rows, columns };
}
