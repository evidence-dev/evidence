// Direct Microsoft Fabric (Azure SQL / T-SQL) query execution from connection.yaml.

import sql from 'mssql';
import { ClientSecretCredential } from '@azure/identity';
import { mapFabricColumns } from '@evidence/core/connectors/fabric/map-columns';
import { normalizeDateRows } from '@evidence/core/connectors/fabric/normalize-date-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { FabricCredentials } from '@evidence/core/connectors/fabric/credentials';
import type { QueryColumn, QueryResult } from './types';

// Azure AD scope for the Fabric / Azure SQL data plane.
const FABRIC_SCOPE = 'https://database.windows.net/.default';
// Rebuild the pool when the cached access token has < this long to live.
const TOKEN_REFRESH_SKEW_MS = 5 * 60_000;

type PooledFabric = {
	pool: sql.ConnectionPool;
	/** epoch ms when the access token backing this pool expires */
	tokenExpiresAt: number;
};

// Resolved pool for the fast path; `pending` holds an in-flight build so
// concurrent callers dedup onto one connection instead of each building their own.
let cached: { key: string; entry: PooledFabric } | null = null;
let pending: { key: string; promise: Promise<PooledFabric> } | null = null;

function configKey(c: FabricCredentials): string {
	// Secrets included so rotating them invalidates the cache (not a security boundary).
	return [c.server, c.database, c.tenantId, c.clientId, c.clientSecret, c.port ?? 1433]
		.map((v) => String(v ?? ''))
		.join('|');
}

async function acquireToken(c: FabricCredentials): Promise<{ token: string; expiresAt: number }> {
	const credential = new ClientSecretCredential(c.tenantId, c.clientId, c.clientSecret);
	const result = await credential.getToken(FABRIC_SCOPE);
	if (!result?.token) throw new Error('Failed to acquire Azure AD access token for Fabric');
	return { token: result.token, expiresAt: result.expiresOnTimestamp };
}

function buildConfig(c: FabricCredentials, token: string): sql.config {
	return {
		server: c.server,
		database: c.database,
		port: c.port ?? 1433,
		authentication: { type: 'azure-active-directory-access-token', options: { token } },
		options: { encrypt: true, trustServerCertificate: false, useUTC: true },
		pool: { min: 0, max: 5, idleTimeoutMillis: 5 * 60_000 },
		connectionTimeout: 30_000,
		requestTimeout: 120_000
	};
}

async function buildPool(c: FabricCredentials): Promise<PooledFabric> {
	const { token, expiresAt } = await acquireToken(c);
	const pool = new sql.ConnectionPool(buildConfig(c, token));
	await pool.connect();
	return { pool, tokenExpiresAt: expiresAt };
}

async function getPool(config: FabricCredentials): Promise<sql.ConnectionPool> {
	const key = configKey(config);

	// The fast path + the dedup check run synchronously (no `await` between them),
	// so two concurrent callers can never both start a build for the same key —
	// otherwise the token-near-expiry rebuild would leak a second pool.
	if (cached?.key === key && cached.entry.tokenExpiresAt - Date.now() > TOKEN_REFRESH_SKEW_MS) {
		// Access-token auth does NOT auto-refresh; only reuse while the token is fresh.
		return cached.entry.pool;
	}
	if (pending?.key === key) return (await pending.promise).pool;

	// `stale` is either absent, a near-expiry pool, or a different config's pool;
	// the init closure owns tearing it down so the swap is atomic w.r.t. other callers.
	const stale = cached;
	const promise = (async () => {
		try {
			if (stale) {
				cached = null;
				stale.entry.pool.close().catch(() => {});
			}
			const entry = await buildPool(config);
			cached = { key, entry };
			return entry;
		} finally {
			if (pending?.key === key) pending = null;
		}
	})();
	pending = { key, promise };
	return (await promise).pool;
}

export async function executeFabricQuery(
	sqlText: string,
	config: FabricCredentials
): Promise<QueryResult> {
	const pool = await getPool(config);

	let rows: Record<string, unknown>[];
	let columns: QueryColumn[];
	try {
		const result = await pool.request().query(sqlText);
		rows = (result.recordset as unknown as Record<string, unknown>[]) ?? [];
		columns = mapFabricColumns(result.recordset?.columns);
	} catch (e) {
		throw new Error(e instanceof Error ? e.message : 'Fabric query failed');
	}

	const dateColumns = new Set(columns.filter((c) => c.jsType === 'date').map((c) => c.name));
	normalizeDateRows(rows, dateColumns);
	normalizeSparklineRows(rows, columns);

	return { rows, columns };
}
