/**
 * Direct Snowflake query execution using the credentials from connection.yaml.
 *
 * One process-cached connection per unique config — sufficient for the local
 * CLI use cases (one-shot subcommands and a single-developer dev server).
 */

import snowflake, {
	type Connection,
	type Column as SfColumn,
	type LogLevel
} from 'snowflake-sdk';
import { buildConnectionOptions } from '@evidence/core/connectors/snowflake/connection-options';
import { mapSnowflakeColumns } from '@evidence/core/connectors/snowflake/map-columns';
import { normalizeDateRows } from '@evidence/core/connectors/snowflake/normalize-date-rows';
import type { SnowflakeCredentials } from '@evidence/core/connectors/snowflake/credentials';
import type { QueryResult } from './types';

const VALID_LOG_LEVELS: ReadonlySet<LogLevel> = new Set([
	'ERROR',
	'WARN',
	'INFO',
	'DEBUG',
	'TRACE',
	'OFF'
]);

function resolveLogLevel(): LogLevel {
	const raw = process.env.SNOWFLAKE_LOG_LEVEL?.toUpperCase();
	if (raw && VALID_LOG_LEVELS.has(raw as LogLevel)) return raw as LogLevel;
	return 'ERROR';
}

// OCSP checks can be slow/flaky locally; mirror studio's stance.
// Silence the SDK's INFO-level logs so they don't pollute query output;
// users can opt back in via SNOWFLAKE_LOG_LEVEL.
snowflake.configure({ ocspFailOpen: true, logLevel: resolveLogLevel() });

let cachedConnection: { key: string; promise: Promise<Connection> } | null = null;

function configKey(c: SnowflakeCredentials): string {
	// Identity by everything that affects the session — secrets are included so
	// rotating them invalidates the cache. Not a security boundary; the cache
	// lives in-process and credentials are already in memory from the YAML.
	const secret = c.authType === 'key_pair' ? c.privateKey : c.password;
	return [c.account, c.username, secret, c.role, c.warehouse, c.database, c.schema]
		.map((v) => v ?? '')
		.join('|');
}

async function getConnection(config: SnowflakeCredentials): Promise<Connection> {
	const key = configKey(config);
	if (cachedConnection?.key === key) return cachedConnection.promise;

	// Tear down the previous connection if the config changed mid-process.
	if (cachedConnection) {
		const prev = cachedConnection.promise;
		prev.then(
			(c) => c.destroy(() => {}),
			() => {}
		);
	}

	const promise = new Promise<Connection>((resolve, reject) => {
		const conn = snowflake.createConnection(buildConnectionOptions(config));
		conn.connect((err) => (err ? reject(err) : resolve(conn)));
	});

	cachedConnection = { key, promise };
	// If connect rejects, drop the cache so next call retries.
	promise.catch(() => {
		if (cachedConnection?.key === key) cachedConnection = null;
	});

	return promise;
}

function executeAsync(
	connection: Connection,
	sql: string
): Promise<{ rows: Record<string, unknown>[]; columns: SfColumn[] }> {
	return new Promise((resolve, reject) => {
		connection.execute({
			sqlText: sql,
			complete: (err, stmt, rows) => {
				if (err) reject(err);
				else
					resolve({
						rows: (rows as Record<string, unknown>[]) ?? [],
						columns: stmt.getColumns() ?? []
					});
			}
		});
	});
}

export async function executeSnowflakeQuery(
	sql: string,
	config: SnowflakeCredentials
): Promise<QueryResult> {
	const connection = await getConnection(config);
	const { rows, columns: sfColumns } = await executeAsync(connection, sql);

	const columns = mapSnowflakeColumns(sfColumns);
	const dateColumns = new Set(columns.filter((c) => c.jsType === 'date').map((c) => c.name));
	normalizeDateRows(rows, dateColumns);

	return { rows, columns };
}
