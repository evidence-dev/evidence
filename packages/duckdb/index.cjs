const {
	getEnv,
	EvidenceType,
	TypeFidelity,
	asyncIterableToBatchedAsyncGenerator,
	cleanQuery
} = require('@evidence-dev/db-commons');
const { Database, OPEN_READONLY, OPEN_READWRITE } = require('duckdb-async');
const path = require('path');

const envMap = {
	filename: [
		{ key: 'EVIDENCE_DUCKDB_FILENAME', deprecated: false },
		{ key: 'DUCKDB_FILENAME', deprecated: false },
		{ key: 'filename', deprecated: true },
		{ key: 'FILENAME', deprecated: true }
	]
};

/**
 *
 * @param {unknown} data
 * @returns {EvidenceType | undefined}
 */
function nativeTypeToEvidenceType(data) {
	switch (typeof data) {
		case 'number':
			return EvidenceType.NUMBER;
		case 'string':
			return EvidenceType.STRING;
		case 'boolean':
			return EvidenceType.BOOLEAN;
		case 'object':
			if (data instanceof Date) {
				return EvidenceType.DATE;
			}
			throw new Error(`Unsupported object type: ${data}`);
		default:
			return EvidenceType.STRING;
	}
}

/**
 *
 * @param {Record<string, unknown>[]} rows
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[]}
 */
const mapResultsToEvidenceColumnTypes = function (rows) {
	return Object.entries(rows[0]).map(([name, value]) => {
		/** @type {TypeFidelity} */
		let typeFidelity = TypeFidelity.PRECISE;
		let evidenceType = nativeTypeToEvidenceType(value);
		if (!evidenceType) {
			typeFidelity = TypeFidelity.INFERRED;
			evidenceType = EvidenceType.STRING;
		}
		return { name, evidenceType, typeFidelity };
	});
};

/** @type {import("chalk")} */
let chalk;

/** @type {import("@evidence-dev/db-commons").RunQuery<DuckDBOptions>} */
const runQuery = async (queryString, database, batchSize = 100000) => {
	if (!chalk) chalk = await import('chalk');

	const filename = database ? database.filename : getEnv(envMap, 'filename') ?? ':memory:';
	const mode = filename !== ':memory:' ? OPEN_READONLY : OPEN_READWRITE;

	try {
		const db = await Database.create(filename, mode);
		const conn = await db.connect();
		const stream = conn.stream(queryString);

		const count_query = `WITH root as (${cleanQuery(queryString)}) SELECT COUNT(*) FROM root`;
		const expected_count = await db.all(count_query).catch(() => null);
		const expected_row_count = expected_count?.[0]['count_star()'];

		const results = await asyncIterableToBatchedAsyncGenerator(stream, batchSize, {
			mapResultsToEvidenceColumnTypes
		});
		results.expectedRowCount = expected_row_count;
		if (typeof results.expectedRowCount === 'bigint') {
			// newer versions of ddb return a bigint
			results.expectedRowCount = Number(results.expectedRowCount);
		}

		return results;
	} catch (err) {
		if (err.message) {
			throw err.message;
		} else {
			throw err;
		}
	}
};

module.exports = runQuery;

/**
 * @typedef {Object} DuckDBOptions
 * @property {string} filename
 */

/**
 * @typedef {Object} QueryResult
 * @property { Record<string, any>[] } rows
 * @property { { name: string, evidenceType: string, typeFidelity: string }[] } columnTypes
 */

/** @type {import("@evidence-dev/db-commons").GetRunner<DuckDBOptions>} */
module.exports.getRunner = async (opts, directory) => {
	if (!opts.filename) {
		console.error(`Missing required duckdb option 'filename' (${directory})`);
	}

	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(
			queryContent,
			{ ...opts, filename: path.join(directory, opts.filename) },
			batchSize
		);
	};
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<DuckDBOptions>} */
module.exports.testConnection = async (opts, directory) => {
	const r = await runQuery('SELECT 1;', { ...opts, filename: path.join(directory, opts.filename) })
		.then(() => true)
		.catch((e) => {
			if (typeof e === 'string' && Boolean(e)) {
				const indentedMessage = `\t${e.split('\n').join('\t')}`;
				console.log(chalk.red.bold(`Error with DuckDB Connector:\n${indentedMessage}`));
				return e;
			}
			return e.message ?? 'File not found';
		});
	return r;
};

module.exports.options = {
	filename: {
		title: 'Filename',
		type: 'string',
		secret: false,
		description:
			'DuckDB filename. This is relative to your source directory, not your project directory.',
		default: 'needful_things.duckdb',
		required: true
	}
};
