const runQuery = require('@evidence-dev/duckdb');

/** @type {import("@evidence-dev/db-commons").RunQuery<never>} */
module.exports = async (queryString) => {
	return runQuery(queryString, { filename: ':memory:' });
};
