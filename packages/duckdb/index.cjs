const { getEnv } = require('@evidence-dev/db-commons');
const { Database, OPEN_READONLY, OPEN_READWRITE } = require('duckdb-async');

const envMap = {
	filename: [
		{ key: 'EVIDENCE_DUCKDB_FILENAME', deprecated: false },
		{ key: 'DUCKDB_FILENAME', deprecated: false },
		{ key: 'filename', deprecated: true },
		{ key: 'FILENAME', deprecated: true }
	]
};

function nativeTypeToEvidenceType(data) {
	switch (typeof data) {
		case 'number':
			return 'number';
		case 'string':
			return 'string';
		case 'boolean':
			return 'boolean';
		case 'object':
			if (data instanceof Date) {
				return 'date';
			}
			return undefined;
		default:
			return 'string';
	}
}

const mapResultsToEvidenceColumnTypes = function (rows) {
	return Object.entries(rows[0]).map(([name, value]) => {
		let typeFidelity = 'precise';
		let evidenceType = nativeTypeToEvidenceType(value);
		if (!evidenceType) {
			typeFidelity = 'inferred';
			evidenceType = 'string';
		}
		return { name, evidenceType, typeFidelity };
	});
};

const runQuery = async (queryString, database) => {
	const filename = database ? database.filename : getEnv(envMap, 'filename');
	const filepath = filename !== ':memory:' ? '../../' + filename : filename;
	const mode = filename !== ':memory:' ? OPEN_READONLY : OPEN_READWRITE;

	try {
		const db = await Database.create(filepath, mode);
		const rows = await db.all(queryString);
		return { rows, columnTypes: mapResultsToEvidenceColumnTypes(rows) };
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

/**
 * @param {DuckDBOptions} opts
 * @returns { (queryString: string, queryOpts: DuckDBOptions ) => Promise<QueryResult> }
 */
module.exports.getRunner = async (opts) => {
	/**
	 * @param {string} queryContent
	 * @param {string} queryPath
	 * @returns {Promise<QueryResult>}
	 */
	return async (queryContent, queryPath) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts);
	};
};
