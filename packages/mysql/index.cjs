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
            user: database ? database.user : process.env["user"] || process.env["USER"],
            host: database ? database.host : process.env["host"] || process.env["HOST"],
            database: database ? database.database : process.env["database"] || process.env["DATABASE"],
            password: database ? database.password : process.env["password"] || process.env["PASSWORD"],
            port: database ? database.port : process.env["port"] || process.env["PORT"],
            ssl: database ? database.ssl : process.env["ssl"] || process.env["SSL"],
            socketPath: database ? database.socketPath : process.env["socketPath"] || process.env["SOCKETPATH"],
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