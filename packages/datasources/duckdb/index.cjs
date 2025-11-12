const {
	EvidenceType,
	TypeFidelity,
	asyncIterableToBatchedAsyncGenerator,
	cleanQuery,
	exhaustStream
} = require('@evidence-dev/db-commons');
const { Database } = require('@duckdb/node-api');
const path = require('path');
const fs = require('fs/promises');

/**
 * Converts BigInt values to Numbers in an object.
 * @param {Record<string, unknown>} obj - The input object with potential BigInt values.
 * @returns {Record<string, unknown>} - The object with BigInt values converted to Numbers.
 */
function standardizeRow(obj) {
	for (const key in obj) {
		if (typeof obj[key] === 'bigint') {
			obj[key] = Number(obj[key]);
		}
	}
	return obj;
}

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

/**
 * @param {{ column_name: string; column_type: string; }[]} describe
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[]}
 */
function duckdbDescribeToEvidenceType(describe) {
	return describe.map((column) => {
		let type;
		if (/DECIMAL/i.test(column.column_type)) {
			type = EvidenceType.NUMBER;
		} else {
			switch (column.column_type) {
				case 'BOOLEAN':
					type = EvidenceType.BOOLEAN;
					break;
				case 'DATE':
				case 'TIMESTAMP':
				case 'TIMESTAMP WITH TIME ZONE':
				case 'TIMESTAMP_S':
				case 'TIMESTAMP_MS':
				case 'TIMESTAMP_NS':
					type = EvidenceType.DATE;
					break;
				case 'DOUBLE':
				case 'FLOAT':
				case 'TINYINT':
				case 'UTINYINT':
				case 'SMALLINT':
				case 'USMALLINT':
				case 'INTEGER':
				case 'UINTEGER':
				case 'UBIGINT':
				case 'HUGEINT':
					type = EvidenceType.NUMBER;
					break;
				case 'BIGINT':
					type = EvidenceType.NUMBER;
					break;
				case 'DECIMAL':
				case 'TIME':
				case 'TIME WITH TIME ZONE':
					type = EvidenceType.STRING;
					break;
				default:
					type = EvidenceType.STRING;
					break;
			}
		}
		return { name: column.column_name, evidenceType: type, typeFidelity: TypeFidelity.PRECISE };
	});
}

/** @type {import("@evidence-dev/db-commons").RunQuery<DuckDBOptions>} */
const runQuery = async (queryString, database, batchSize = 100000) => {
	let filename = ':memory:';

	if (database?.filename) {
		if (database.filename.startsWith('md:') || database.filename === ':memory:') {
			// MotherDuck or in-memory database
			filename = database.filename;
		} else if (database.directory) {
			// Local database stored in source directory
			filename = path.join(database.directory, database.filename);
		}
	}

	const mode = filename !== ':memory:' ? 'READ_ONLY' : 'READ_WRITE';
	const db = await Database.create(filename, {
		access_mode: mode,
		custom_user_agent: 'evidence-dev'
	});
	const conn = await db.connect();

	if (database?.directory) {
		const contents = await fs.readdir(database.directory);
		if (contents.find((d) => d === 'initialize.sql')) {
			const initScript = await fs.readFile(path.resolve(database.directory, 'initialize.sql'), {
				encoding: 'utf-8'
			});
			await conn.exec(initScript);
		}
	}

	const stream = conn.stream(queryString);

	const count_query = `WITH root as (${cleanQuery(queryString)}) SELECT COUNT(*) FROM root`;
	const expected_count = await db.all(count_query).catch(() => null);
	const expected_row_count = expected_count?.[0]['count_star()'];

	const column_query = `DESCRIBE ${cleanQuery(queryString)}`;
	const column_types = await db
		.all(column_query)
		.then(duckdbDescribeToEvidenceType)
		.catch(() => null);

	const results = await asyncIterableToBatchedAsyncGenerator(stream, batchSize, {
		mapResultsToEvidenceColumnTypes:
			column_types == null ? mapResultsToEvidenceColumnTypes : undefined,
		standardizeRow,
		closeConnection: () => db.close()
	});
	if (column_types != null) {
		results.columnTypes = column_types;
	}
	results.expectedRowCount = expected_row_count;
	if (typeof results.expectedRowCount === 'bigint') {
		// newer versions of ddb return a bigint
		results.expectedRowCount = Number(results.expectedRowCount);
	}

	return results;
};

module.exports = runQuery;

/**
 * @typedef {Object} DuckDBOptions
 * @property {string} filename
 * @property {string} directory
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
		if (queryPath.endsWith('initialize.sql')) return null;
		return runQuery(queryContent, { ...opts, directory: directory }, batchSize);
	};
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<DuckDBOptions>} */
module.exports.testConnection = async (opts, directory) => {
	const r = await runQuery('SELECT 1;', {
		...opts,
		directory: directory
	})
		.then(exhaustStream)
		.then(() => true)
		.catch((e) => {
			if (typeof e === 'string' && e !== '') {
				const indentedMessage = `\n\t${e.split('\n').join('\n\t')}`;
				return { reason: indentedMessage };
			}
			return { reason: e.message ?? 'File not found' };
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
