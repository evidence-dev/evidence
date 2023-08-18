const runQuery = require('@evidence-dev/duckdb');

/** @type {import("@evidence-dev/db-commons").RunQuery<never>} */
module.exports = async (queryString) => {
	return runQuery(queryString, { filename: ':memory:' });
};

/** @type {import("@evidence-dev/db-commons").GetRunner<never>} */
module.exports.getRunner = () => {
	return async (queryContent, queryPath) => {
		// Filter out non-csv files
		if (!queryPath.endsWith('.csv')) return null;
		// Use DuckDBs auto CSV loading
		// https://duckdb.org/docs/data/csv/overview.html
		return runQuery(`SELECT * FROM '${queryPath}'`);
	};
};
