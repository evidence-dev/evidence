const mysql = require('mysql2');

const standardizeResult = async (result) => {
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
        const credentials = {
            user: database ? database.user : process.env["user"],
            host: database ? database.host : process.env["host"],
            database: database ? database.database : process.env["database"],
            password: database ? database.password : process.env["password"],
            port: database ? database.port : process.env["port"],
            ssl: database ? database.ssl : process.env["ssl"] ?? false,
            socketPath: database ? database.socketPath : process.env["socketPath"] ?? "",
            decimalNumbers: true
        }

        var pool = mysql.createPool(credentials);
        const promisePool = pool.promise();
        const [rows, fields] = await promisePool.query(queryString);

        const stardizedResults = await standardizeResult(rows)

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