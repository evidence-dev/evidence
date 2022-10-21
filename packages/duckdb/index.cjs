const path = require('path')
const { processQueryResults } = require('@evidence-dev/db-commons')
const { Database } = require('duckdb-async');

const runQuery = async (queryString, database) => {
    const filename = database ? database.filename : process.env["DUCKDB_FILENAME"] || process.env["filename"] || process.env["FILENAME"]
    const filepath = filename !== ":memory:" ? "../../" + filename : filename
    const db = await Database.create(filepath);
    const rows = await db.all(queryString);
    return processQueryResults(rows);
}

module.exports = runQuery
