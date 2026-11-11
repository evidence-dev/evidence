/**
 * Local DuckDB query executor.
 *
 * Instances are cached per database path, while individual connections
 * are short-lived. The driver returns JSON-safe values.
 */
import { DuckDBInstance } from '@duckdb/node-api';
import { getMotherduckToJsType } from '@evidence/core/connectors/motherduck/type-mapping';
import { normalizeDateRows } from '@evidence/core/connectors/postgres/normalize-date-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { DuckDBCredentials } from '@evidence/core/connectors/duckdb/credentials';
import type { QueryResult } from './types';
import {
	duckDBServeConfiguration,
	isHardenedDuckDBServe,
	lockDownDuckDBInstance
} from './duckdb-security';

/**
 * In-memory databases are scoped to an Evidence project rather than
 * shared by every project using the DuckDB ':memory:' marker.
 *
 * Cache the creation promise so concurrent queries share one instance.
 */
const memoryInstances = new Map<string, Promise<DuckDBInstance>>();
const hardenedInstances = new Map<string, Promise<DuckDBInstance>>();

function getHardenedDuckDBInstance(config: DuckDBCredentials): Promise<DuckDBInstance> {
	const key = JSON.stringify([config.database, config.projectDir]);
	const existing = hardenedInstances.get(key);
	if (existing) return existing;

	// No query can reach this instance until the full security policy has
	// been installed and locked. Cache the initialization promise to prevent
	// concurrent HTTP requests from observing an unconfined connection.
	const pending = (async () => {
		const options = duckDBServeConfiguration(config);
		const instance =
			config.database === ':memory:'
				? await DuckDBInstance.create(':memory:', options)
				: await DuckDBInstance.fromCache(config.database, options);
		await lockDownDuckDBInstance(instance, config);
		return instance;
	})().catch((error: unknown) => {
		hardenedInstances.delete(key);
		throw error;
	});

	hardenedInstances.set(key, pending);
	return pending;
}

function getDuckDBInstance(config: DuckDBCredentials): Promise<DuckDBInstance> {
	if (isHardenedDuckDBServe()) return getHardenedDuckDBInstance(config);

	if (config.database !== ':memory:') {
		return DuckDBInstance.fromCache(config.database);
	}

	const key = config.projectDir;
	const existing = memoryInstances.get(key);
	if (existing) return existing;

	const pending = DuckDBInstance.create(':memory:').catch((error: unknown) => {
		memoryInstances.delete(key);
		throw error;
	});

	memoryInstances.set(key, pending);
	return pending;
}

/**
 * Convert numeric JSON strings only when the conversion is lossless.
 * Large integers and high-precision decimals remain strings.
 */
function safeNumericValue(value: unknown): unknown {
	if (typeof value !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(value)) {
		return value;
	}

	const parsed = Number(value);

	if (!Number.isFinite(parsed)) return value;
	if (Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
		return value;
	}

	const normalized = value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value;

	return String(parsed) === normalized ? parsed : value;
}

/**
 * JSON row objects must have unique keys. DuckDB permits repeated SQL aliases,
 * so disambiguate only their output labels; avoid colliding with explicit
 * suffixed aliases later in the result (e.g. duplicate, duplicate, duplicate_2).
 */
function uniqueColumnNames(rawNames: string[]): string[] {
	const reserved = new Set(rawNames);
	const used = new Set<string>();

	return rawNames.map((name) => {
		if (!used.has(name)) {
			used.add(name);
			return name;
		}

		let suffix = 2;
		let candidate = `${name}_${suffix}`;
		while (reserved.has(candidate) || used.has(candidate)) {
			suffix += 1;
			candidate = `${name}_${suffix}`;
		}

		used.add(candidate);
		return candidate;
	});
}

export async function executeDuckDBQuery(
	sql: string,
	config: DuckDBCredentials
): Promise<QueryResult> {
	const instance = await getDuckDBInstance(config);
	const connection = await instance.connect();

	try {
		// Serve instances already have a locked, project-scoped file search
		// path. Trusted CLI/dev connections retain their existing behavior.
		if (!isHardenedDuckDBServe()) {
			const escapedRoot = config.projectDir.replace(/'/g, "''");
			await connection.runAndReadAll(`SET file_search_path = '${escapedRoot}'`);
		}

		const reader = await connection.runAndReadAll(sql);

		const rawNames = reader.columnNames();
		const names = uniqueColumnNames(rawNames);
		const hasDuplicateNames = names.some((name, index) => name !== rawNames[index]);
		const types = reader.columnTypes();

		const columns = names.map((name, index) => {
			const duckdbType = types[index].toString();

			return {
				name,
				clickhouseType: duckdbType,
				// The native node-api JSON converter returns INTERVAL as a structured
				// { months, days, micros } object, unlike the Postgres-wire client.
				jsType: duckdbType === 'INTERVAL' ? 'object' : getMotherduckToJsType(duckdbType)
			};
		});

		// getRowObjectsJson() uses SQL aliases as object keys; duplicate aliases
		// overwrite earlier values. Read positional JSON rows only when needed.
		const rows: Record<string, unknown>[] = hasDuplicateNames
			? reader
					.getRowsJson()
					.map((values) => Object.fromEntries(names.map((name, index) => [name, values[index]])))
			: reader.getRowObjectsJson();

		const numericColumns = columns
			.filter((column) => column.jsType === 'number')
			.map((column) => column.name);

		for (const row of rows) {
			for (const name of numericColumns) {
				row[name] = safeNumericValue(row[name]);
			}
		}

		const dateColumns = new Set(
			columns.filter((column) => column.jsType === 'date').map((column) => column.name)
		);

		normalizeDateRows(rows, dateColumns);
		normalizeSparklineRows(rows, columns);

		return { rows, columns };
	} finally {
		connection.closeSync();
	}
}
