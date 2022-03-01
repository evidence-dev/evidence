const { Pool } = require('pg');

const standardizeResult = async(result) => {
    var output = [];
    result.forEach(row => {
        const lowerCasedRow = {};
        for (const [key, value] of Object.entries(row)) {
            lowerCasedRow[key.toLowerCase()] = value;
        }   
        output.push(lowerCasedRow);
    });
	return output;
}

const runQuery = async (queryString, database) => {
    try {
        const credentials =  {
            user: database ? database.user : process.env["user"] || process.env["USER"],
            host: database ? database.host : process.env["host"] || process.env["HOST"],
            database: database ? database.database : process.env["database"] || process.env["DATABASE"],
            password: database ? database.password : process.env["password"] || process.env["PASSWORD"],
            port: database ? database.port : process.env["port"] || process.env["PORT"],
            ssl: database ? database.ssl : process.env["ssl"] || process.env["SSL"],
            connectionString: database ? database.connectionString : process.env["connectionString"] || process.env["CONNECTIONSTRING"]
        }

        // Override types returned by pg package. The package will return some numbers as strings
        // to avoid loss of accuracy in very large numbers. This is something to keep an eye on,
        // but for now, we are replacing the default parsing functions with the applicable
        // JavaScript parsing function for each data type:
        var types = require('pg').types

        // Override bigint:
        types.setTypeParser(20, function(val) {
            return parseInt(val, 10)
        })

        // Override numeric/decimal:
        types.setTypeParser(1700, function(val) {
            return parseFloat(val)
        })

        // Override money (incl. removing currency symbol):
        types.setTypeParser(790, function(val) {
            return parseFloat(val.replace(/[^0-9.]/g, ''))
        })

        var pool = new Pool(credentials);
        var result = await pool.query(queryString)

        const stardizedResults = await standardizeResult(result.rows)

        return stardizedResults
    }
    catch (err) {
        if (err.message) {
            throw err.message.replace(/\n|\r/g, " ")
        } else {
            throw err.replace(/\n|\r/g, " ")
        }
    }
}

module.exports = runQuery