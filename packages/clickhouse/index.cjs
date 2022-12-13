const path = require('path')
const { processQueryResults } = require('@evidence-dev/db-commons')
const { ClickHouse } = require('clickhouse')

const runQuery = async (queryString, database) => {
    try {
        const opts = {
            url: database.url || process.env["CLICKHOUSE_URL"] || process.env["url"] || process.env["URL"],
            port: database.port || process.env["CLICKHOUSE_PORT"] || process.env["port"] || process.env["PORT"] || 8123,
            basicAuth: {
                username: database.user || process.env["CLICKHOUSE_USERNAME"] || process.env["username"] || process.env["USERNAME"],
                password: database.password || process.env["CLICKHOUSE_PASSWORD"] || process.env["password"] || process.env["PASSWORD"],
            },
            format: "tsv",
            config: {
                database: database.database || process.env["CLICKHOUSE_DATABASE"] || process.env["database"] || process.env["DATABASE"]
            }
        }
        const clickhouse = new ClickHouse(opts)
        const rows = await clickhouse.query(queryString).toPromise()
        return processQueryResults(rows)
    } catch(err) {
        if (err.message) {
            throw err.message;
        } else {
            throw err;
        }
    }
}

module.exports = runQuery
