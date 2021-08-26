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
            user: database.user ?? process.env["user"],
            host: database.host ?? process.env["host"],
            database: database.database ?? process.env["database"],
            password: database.password ?? process.env["password"],
            port: database.port ?? process.env["port"],
        }

        var types = require('pg').types
        types.setTypeParser(20, function(val) {
            return parseInt(val, 10)
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