/**
 * Direct ClickHouse query execution using the credentials from connection.yaml.
 *
 * One process-cached client per unique config — sufficient for the local
 * CLI use cases (one-shot subcommands and a single-developer dev server).
 */

import { createClient, ClickHouseLogLevel, type ClickHouseClient } from '@clickhouse/client';
import {
	mapClickHouseColumns,
	type ClickHouseColumnMeta
} from '@evidence/core/connectors/clickhouse/map-columns';
import type { ClickHouseCredentials } from '@evidence/core/connectors/clickhouse/credentials';
import type { QueryResult } from './types';

let cachedClient: { key: string; client: ClickHouseClient } | null = null;

function configKey(c: ClickHouseCredentials): string {
	// Identity by everything that affects the session — secrets included so
	// rotating them invalidates the cache. Not a security boundary; the cache
	// lives in-process and credentials are already in memory from the YAML.
	return [c.url, c.username, c.password ?? '', c.accessToken ?? '', c.database].join('|');
}

function getClient(config: ClickHouseCredentials): ClickHouseClient {
	const key = configKey(config);
	if (cachedClient?.key === key) return cachedClient.client;

	// Tear down the previous client if the config changed mid-process.
	cachedClient?.client.close().catch(() => {});

	const client = createClient({
		url: config.url,
		database: config.database,
		application: 'evidence-cli',
		log: { level: ClickHouseLogLevel.OFF },
		// The default 30s request timeout is too low for analytic queries.
		request_timeout: 300_000,
		clickhouse_settings: {
			// Unquoted so (U)Int64 columns arrive as JS numbers, matching the
			// jsType the column mapper reports. Values beyond 2^53 lose precision,
			// the same trade-off the other direct connectors make.
			output_format_json_quote_64bit_integers: 0
		},
		// Schema enforces exactly one of access_token / password.
		...(config.accessToken
			? { access_token: config.accessToken }
			: { username: config.username, password: config.password ?? '' })
	});
	cachedClient = { key, client };
	return client;
}

export async function executeClickHouseQuery(
	sql: string,
	config: ClickHouseCredentials
): Promise<QueryResult> {
	const client = getClient(config);
	const resultSet = await client.query({ query: sql, format: 'JSON' });
	const payload = await resultSet.json<Record<string, unknown>>();
	// JSON format already emits dates as "YYYY-MM-DD [HH:MM:SS]" — the shape the
	// managed engine returns — so no row normalization is needed.
	return {
		rows: (payload.data as Record<string, unknown>[]) ?? [],
		columns: mapClickHouseColumns((payload.meta ?? []) as ClickHouseColumnMeta[])
	};
}
