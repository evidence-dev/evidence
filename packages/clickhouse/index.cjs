const path = require('path')
const { processQueryResults } = require('@evidence-dev/db-commons')
const { ClickHouse } = require('clickhouse');

const runQuery = async (queryString, database) => {
    try {
        const clickhouse = new ClickHouse({
            url: process.env["CLICKHOUSE_URL"],
            port: process.env["CLICKHOUSE_PORT"],
            basicAuth: {
                "username": process.env["CLICKHOUSE_USERNAME"],
                "password": process.env["CLICKHOUSE_PASSWORD"],
            },
            config: {
                database: database
            }
        })
        const rows = await clickhouse.query(queryString).toPromise();
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
