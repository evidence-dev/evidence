const path = require('path');
const { processQueryResults } = require('@evidence-dev/db-commons');
const { Database, OPEN_READONLY, OPEN_READWRITE } = require('duckdb-async');

const runQuery = async (queryString, database) => {
	const filename = database
		? database.filename
		: process.env['DUCKDB_FILENAME'] || process.env['filename'] || process.env['FILENAME'];
	const filepath = filename !== ':memory:' ? '../../' + filename : filename;
	const mode = filename !== ':memory:' ? OPEN_READONLY : OPEN_READWRITE;

	try {
		const db = await Database.create(filepath, mode);
		const rows = await db.all(queryString);
		return processQueryResults(rows);
	} catch (err) {
		if (err.message) {
			throw err.message;
		} else {
			throw err;
		}
	}
};

module.exports = runQuery;
