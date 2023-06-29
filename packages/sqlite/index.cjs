const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const { processQueryResults, getEnv } = require('@evidence-dev/db-commons');

const envMap = {
	filename: [
		{ key: 'EVIDENCE_SQLITE_FILENAME', deprecated: false },
		{ key: 'SQLITE_FILENAME', deprecated: false },
		{ key: 'FILENAME', deprecated: true },
		{ key: 'filename', deprecated: true }
	]
};

const runQuery = async (queryString, database) => {
	const filename = database ? database.filename : getEnv(envMap, 'filename');
	const filepath = filename !== ':memory:' ? '../../' + filename : filename;
	try {
		const db = await open({
			filename: filepath,
			driver: sqlite3.Database,
			mode: sqlite3.OPEN_READONLY
		});
		const result = await db.all(queryString);
		return processQueryResults(result);
	} catch (err) {
		if (err.message) {
			if (err.errno === 14) {
				throw 'Unable to open ' + filename + ' in ' + path.resolve('../../');
			} else {
				throw err.message;
			}
		} else {
			throw err;
		}
	}
};

module.exports = runQuery;

/**
 * @typedef {Object} SQLiteOptions
 * @property {string} filename
 */

/**
 * @typedef {Object} QueryResult
 * @property { Record<string, any>[] } rows
 * @property { { name: string, evidenceType: string, typeFidelity: string }[] } columnTypes
 */

/**
 * @param {SQLiteOptions} opts
 * @returns { (queryString: string, queryOpts: SQLiteOptions ) => Promise<QueryResult> }
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
