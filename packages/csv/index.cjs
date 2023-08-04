const runQuery = require('@evidence-dev/duckdb');
const path = require('path');

/** @type {import("@evidence-dev/db-commons").RunQuery<never>} */
module.exports = async (queryString) => {
	return runQuery(queryString, { filename: ':memory:' });
};

module.exports.getRunner = (opts, directory) => {
	/**
	 * @param {string} queryContent
	 * @param {string} queryPath
	 * @returns {Promise<QueryResult>}
	 */
	return async (queryContent, queryPath) => {
		// Filter out non-csv files
		if (!queryPath.endsWith('.csv')) return null;
		// Use DuckDBs auto CSV loading
		// https://duckdb.org/docs/data/csv/overview.html
		return runQuery(
			`SELECT *
                         FROM '${queryPath}'`,
			{ filename: ':memory:' }
		);
	};
};
