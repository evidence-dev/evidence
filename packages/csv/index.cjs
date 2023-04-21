const runQuery = require('@evidence-dev/duckdb');

module.exports = async (queryString) => {
	return runQuery(queryString, { filename: ':memory:' });
};
