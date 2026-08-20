/**
 * Direct BigQuery query execution using the credentials from connection.yaml.
 *
 * One process-cached client per unique config — sufficient for the local
 * CLI use cases (one-shot subcommands and a single-developer dev server).
 */

import { BigQuery } from '@google-cloud/bigquery';
import { buildBigQueryClientOptions } from '@evidence/core/connectors/bigquery/client-options';
import { mapBigQueryColumns, type BigQueryField } from '@evidence/core/connectors/bigquery/map-columns';
import { normalizeDateRows } from '@evidence/core/connectors/bigquery/normalize-date-rows';
import { normalizeNumericRows } from '@evidence/core/connectors/bigquery/normalize-numeric-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { BigQueryCredentials } from '@evidence/core/connectors/bigquery/credentials';
import type { QueryResult } from './types';

let cachedClient: { key: string; client: BigQuery } | null = null;

function configKey(c: BigQueryCredentials): string {
	// Identity by everything that affects the client. private_key is excluded:
	// rotating it produces a new client_email in practice, and including a long
	// PEM in a join key is wasteful.
	return [
		c.projectId,
		c.serviceAccountJson.client_email,
		c.location ?? '',
		c.defaultDataset ?? ''
	].join('|');
}

function getClient(config: BigQueryCredentials): BigQuery {
	const key = configKey(config);
	if (cachedClient?.key === key) return cachedClient.client;
	const opts = buildBigQueryClientOptions(config);
	const client = new BigQuery(opts);
	cachedClient = { key, client };
	return client;
}

function bqErrorMessage(e: unknown): string {
	if (e instanceof Error) {
		// BigQuery wraps GoogleAPI errors with `errors: [{ message, reason }]`
		const errs = (e as Error & { errors?: Array<{ message?: string }> }).errors;
		if (Array.isArray(errs) && errs.length > 0 && typeof errs[0]?.message === 'string') {
			return errs[0].message!;
		}
		return e.message;
	}
	return 'BigQuery query failed';
}

export async function executeBigQueryQuery(
	sql: string,
	config: BigQueryCredentials
): Promise<QueryResult> {
	const client = getClient(config);
	let rows: Record<string, unknown>[];
	let fields: BigQueryField[];
	try {
		// The SDK declares `query()` as a 1-tuple `[RowMetadata[]]` but the
		// underlying job.getQueryResults runtime resolves to `[rows, nextQuery,
		// response]`. We need element [2] for the schema; cast to access it.
		const result = (await client.query({
			query: sql,
			useLegacySql: false,
			location: config.location,
			defaultDataset: config.defaultDataset
				? { datasetId: config.defaultDataset, projectId: config.projectId }
				: undefined,
			// INT64 outside ±2^53 throws without this; coerce to lossy Number instead.
			wrapIntegers: { integerTypeCastFunction: (v: unknown) => Number(v) }
		})) as unknown as [
			Record<string, unknown>[],
			unknown,
			{ schema?: { fields?: BigQueryField[] } } | undefined
		];
		const [rowsResult, , metadata] = result;
		rows = rowsResult ?? [];
		fields = (metadata?.schema?.fields ?? []) as BigQueryField[];
	} catch (e) {
		throw new Error(bqErrorMessage(e));
	}

	const columns = mapBigQueryColumns(fields);
	const dateColumns = new Set(columns.filter((c) => c.jsType === 'date').map((c) => c.name));
	const numericColumns = new Set(
		columns.filter((c) => c.jsType === 'number').map((c) => c.name)
	);
	normalizeDateRows(rows, dateColumns);
	normalizeNumericRows(rows, numericColumns);
	normalizeSparklineRows(rows, columns);

	return { rows, columns };
}
