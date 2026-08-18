/**
 * Direct Postgres query execution using the credentials from connection.yaml.
 *
 * Covers every Postgres-wire source — generic Postgres, Amazon RDS / Aurora,
 * Supabase, Neon, Timescale, etc. One process-cached pool per unique config,
 * sufficient for the local CLI use cases (one-shot subcommands and a
 * single-developer dev server). No RLS session variables: the CLI has no
 * per-user identity.
 */

import pg from 'pg';
import { mapPostgresColumns } from '@evidence/core/connectors/postgres/map-columns';
import { buildPostgresSsl } from '@evidence/core/connectors/postgres/connection-options';
import {
	makePostgresTypeParser,
	pgSetSearchPathStatement
} from '@evidence/core/connectors/postgres/pg-type-parsers';
import { normalizeDateRows } from '@evidence/core/connectors/postgres/normalize-date-rows';
import { normalizeNumericRows } from '@evidence/core/connectors/postgres/normalize-numeric-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { PostgresCredentials } from '@evidence/core/connectors/postgres/credentials';
import type { Column } from '@evidence/core/user-components/interfaces/query-service';
import type { QueryResult } from './types';

let cachedPool: { key: string; pool: pg.Pool } | null = null;

function configKey(c: PostgresCredentials): string {
	// Identity by everything that affects the connection — secrets AND TLS material
	// included so rotating any of them (e.g. a new CA/cert/key without changing the
	// mode) invalidates the cached pool instead of reusing stale trust material.
	// JSON.stringify (not join) so a field value containing the delimiter can't
	// collide with a different credential set. Not a security boundary; the pool
	// lives in-process and creds are already in memory from the YAML.
	return JSON.stringify([
		c.host,
		c.port,
		c.user,
		c.password,
		c.database,
		c.schema,
		c.ssl.mode,
		c.ssl.ca ?? '',
		c.ssl.cert ?? '',
		c.ssl.key ?? ''
	]);
}

function getPool(config: PostgresCredentials): pg.Pool {
	const key = configKey(config);
	if (cachedPool?.key === key) return cachedPool.pool;

	// Tear down the previous pool if the config changed mid-process.
	cachedPool?.pool.end().catch(() => {});

	const pool = new pg.Pool({
		host: config.host,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database,
		application_name: 'evidence-cli',
		ssl: buildPostgresSsl(config.ssl),
		// Return date/timestamp types as strings so no-tz timestamps aren't shifted
		// by the host timezone (the CLI runs on developer laptops) — see pg-type-parsers.
		types: { getTypeParser: makePostgresTypeParser(pg.types.getTypeParser) },
		// Analytic queries can run long; the 0 (no timeout) default is fine, but a
		// short connect timeout surfaces bad hosts quickly instead of hanging.
		connectionTimeoutMillis: 30_000
	});
	// node-postgres emits 'error' on the POOL when an idle backend connection dies
	// (server restart, network blip, pooler idle-kill). With no listener that would
	// be rethrown as an uncaught exception and crash the long-lived `evidence dev`
	// process — so swallow it; the pool re-establishes connections on next use.
	pool.on('error', (err) => console.error('[postgres] idle client error:', err.message));
	// Set the default schema per connection via SET (not the libpq `options`
	// startup param, which poolers like Neon/Supabase reject).
	pool.on('connect', (client) => {
		client
			.query(pgSetSearchPathStatement(config.schema))
			.catch((err) => console.error('[postgres] failed to set search_path:', err.message));
	});
	cachedPool = { key, pool };
	return pool;
}

export async function executePostgresQuery(
	sql: string,
	config: PostgresCredentials
): Promise<QueryResult> {
	const pool = getPool(config);
	const result = await pool.query({ text: sql, rowMode: 'array' as const });

	const columns: Column[] = mapPostgresColumns(
		result.fields.map((f) => ({ columnName: f.name, dataTypeID: f.dataTypeID }))
	);

	// rowMode 'array' returns each row as a positional array; rebuild keyed rows.
	// NOTE: like every Evidence connector, rows are keyed by column name, so two
	// columns with the same name collapse to the last value — alias duplicates in SQL.
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
