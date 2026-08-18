/**
 * Direct MotherDuck query execution using the credentials from connection.yaml.
 *
 * MotherDuck is queried over its Postgres-wire endpoint (the pattern MotherDuck
 * recommends for thin clients / applications), so this is a thin `pg` client —
 * no native DuckDB engine. The service token is the password; TLS is mandatory.
 * One process-cached pool per unique config, sufficient for the local CLI use
 * cases (one-shot subcommands and a single-developer dev server).
 */

import pg from 'pg';
import { mapPostgresColumns } from '@evidence/core/connectors/postgres/map-columns';
import { makePostgresTypeParser } from '@evidence/core/connectors/postgres/pg-type-parsers';
import { normalizeDateRows } from '@evidence/core/connectors/postgres/normalize-date-rows';
import { normalizeNumericRows } from '@evidence/core/connectors/postgres/normalize-numeric-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { MotherduckCredentials } from '@evidence/core/connectors/motherduck/credentials';
import type { Column } from '@evidence/core/user-components/interfaces/query-service';
import type { QueryResult } from './types';

const MOTHERDUCK_PORT = 5432;
const MOTHERDUCK_USER = 'postgres';

let cachedPool: { key: string; pool: pg.Pool } | null = null;

// `host` is configurable (region override), so only MotherDuck's own endpoints
// are allowed — blocks connecting to an arbitrary host via a crafted value.
function assertMotherduckHost(host: string): void {
	if (!/^[a-z0-9.-]+\.motherduck\.com$/i.test(host)) {
		throw new Error(`Invalid MotherDuck host "${host}" — must be a *.motherduck.com endpoint`);
	}
}

function configKey(c: MotherduckCredentials): string {
	// Identity by everything that affects the connection. JSON.stringify (not join)
	// so a value containing the delimiter can't collide with a different set.
	return JSON.stringify([c.host, c.database, c.token]);
}

function getPool(config: MotherduckCredentials): pg.Pool {
	const key = configKey(config);
	if (cachedPool?.key === key) return cachedPool.pool;

	// Tear down the previous pool if the config changed mid-process.
	cachedPool?.pool.end().catch(() => {});

	assertMotherduckHost(config.host);
	const pool = new pg.Pool({
		host: config.host,
		port: MOTHERDUCK_PORT,
		user: MOTHERDUCK_USER,
		password: config.token,
		database: config.database,
		application_name: 'evidence-cli',
		// TLS mandatory; MotherDuck presents a public-CA cert (verify-full equivalent).
		ssl: { rejectUnauthorized: true },
		// Return date/timestamp types as strings so no-tz timestamps aren't shifted
		// by the host timezone (the CLI runs on developer laptops) — see pg-type-parsers.
		types: { getTypeParser: makePostgresTypeParser(pg.types.getTypeParser) },
		connectionTimeoutMillis: 30_000
	});
	// Unlike a generic Postgres pool we do NOT run `SET` on connect — MotherDuck's
	// endpoint rejects SET statements; schema scoping is done via qualified names.
	pool.on('error', (err) => console.error('[motherduck] idle client error:', err.message));
	cachedPool = { key, pool };
	return pool;
}

export async function executeMotherduckQuery(
	sql: string,
	config: MotherduckCredentials
): Promise<QueryResult> {
	const pool = getPool(config);
	const result = await pool.query({ text: sql, rowMode: 'array' as const });

	const columns: Column[] = mapPostgresColumns(
		result.fields.map((f) => ({ columnName: f.name, dataTypeID: f.dataTypeID }))
	);

	// rowMode 'array' returns each row as a positional array; rebuild keyed rows.
	// Rows are keyed by column name, so duplicate names collapse to the last value —
	// alias duplicates in SQL.
	const rows: Record<string, unknown>[] = (result.rows as unknown[][]).map((arr) => {
		const row: Record<string, unknown> = {};
		columns.forEach((col, i) => {
			row[col.name] = arr[i];
		});
		return row;
	});

	const dateColumns = new Set(columns.filter((c) => c.jsType === 'date').map((c) => c.name));
	const numericColumns = new Set(columns.filter((c) => c.jsType === 'number').map((c) => c.name));
	normalizeDateRows(rows, dateColumns);
	normalizeNumericRows(rows, numericColumns);
	normalizeSparklineRows(rows, columns);

	return { rows, columns };
}
