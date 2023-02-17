const path = require('path')
const { processQueryResults } = require('@evidence-dev/db-commons')
const { Database, OPEN_READONLY, OPEN_READWRITE } = require('duckdb-async');

const runQuery = async (queryString, database) => {
    const filename = database ? database.filename : process.env["DUCKDB_FILENAME"] || process.env["filename"] || process.env["FILENAME"];
    const filepath = filename !== ":memory:" ? "../../" + filename : filename;
    const mode = filename !== ":memory:" ? OPEN_READONLY : OPEN_READWRITE;

    try {
        const db = await Database.create(filepath, mode);
        const statements = queryString
          .split(";")
          .map((statement) => statement.trim())
          .filter((statement) => statement.length > 0);
        const [execs, selects] = statements.reduce(
          ([execs, selects], current) => {
            current.startsWith("select")
              ? selects.push(current)
              : execs.push(current);
            return [execs, selects];
          },
          [[], []]
        );
        if (execs.length > 0) {
          await db.exec(execs.join(";"));
        }

        const rows = await db.all(selects[0]);
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
