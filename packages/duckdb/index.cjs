const path = require('path')
const { processQueryResults } = require('@evidence-dev/db-commons')
const { Database, OPEN_READONLY } = require('duckdb-async');

const runQuery = async (queryString, database) => {
    const filename = database ? database.filename : process.env["DUCKDB_FILENAME"] || process.env["filename"] || process.env["FILENAME"]
    const filepath = filename !== ":memory:" ? "../../" + filename : filename
    try {
        const db = await Database.create(filepath, OPEN_READONLY);
        const rows = await db.all(queryString);
        return processQueryResults(rows);
    } catch(err) {
        if (err.message) {
                throw err.message
            }
        else {
            throw err
        }
    }
}

module.exports = runQuery
