const createConnection = require('snowflake-sdk')

const execute = async (connection, queryString) => {
    return new Promise((resolve, reject) => {
        connection.connect(
            function (err, conn) {
                if (err) {
                    reject('Unable to connect: ' + err.message);
                }
                else {
                    connection_ID = conn.getId();
                }
            }
        );
        connection.execute({
            sqlText: queryString,
            complete: function (err, stmt, rows) {
                if (err) {
                    reject(err)
                } else
                    resolve(rows)
            }
        });
    })
}

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
        var connection = createConnection.createConnection({
            account: database.account ?? process.env["account"],
            username: database.username ?? process.env["username"],
            password: database.password ?? process.env["password"]
        });

        const result = await execute(connection, queryString)
        const stardizedResults = await standardizeResult(result)
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