const createConnection = require('snowflake-sdk');

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
                    reject(err);
                } else {
                    let columns;
                    if (stmt) {
                        columns = stmt.getColumns()?.map(next => {return {'name' : next.getName(), 'type' : next.getType()}});
                    }
                    resolve({rows, columns});
                }
            }
        });
    })
}

const nativeTypeToEvidenceType = function (dataBaseType, defaultResultEvidenceType = undefined) {
    if (dataBaseType) {
        let standardizedDBType = dataBaseType.toUpperCase();
        if (standardizedDBType.indexOf('(') >= 0) { //handles NUMBER(precision, scale) etc
            standardizedDBType = standardizedDBType.substring(0, dataType.indexOf('(')).trim();
        }
        switch (standardizedDBType) {
            case 'BOOLEAN':
                return 'boolean';
            case 'INT':
            case 'INTEGER':
            case 'BIGINT':
            case 'SMALLINT':
            case 'NUMBER':
            case 'DECIMAL':
            case 'NUMERIC':
            case 'FLOAT':
            case 'FLOAT4':
            case 'FLOAT8':
            case 'DOUBLE':
            case 'DOUBLE PRECISION':
            case 'REAL':
            case 'FIXED':
                return 'number';
            case 'VARCHAR':
            case 'CHAR':
            case 'CHARACTER':
            case 'STRING':
            case 'TEXT':
            case 'TIME':
                return 'string';
            case 'TIMESTAMP':
            case 'TIMESTAMP_LTZ':
            case 'TIMESTAMP_NTZ':
            case 'TIMESTAMP_TZ':
            case 'DATE':
                return 'date';
            case 'VARIANT':
            case 'ARRAY':
            case 'OBJECT':
                return defaultResultEvidenceType;
        }
    }
    return defaultResultEvidenceType;
};

const mapResultsToEvidenceColumnTypes = function (results) {
    return results?.columns?.map(field => {
        let typeFidelity = 'precise';
        let evidenceType = nativeTypeToEvidenceType(field.type);
        if (!evidenceType) {
            typeFidelity = 'inferred';
            evidenceType = 'string';
        }
        return (
          {
            'name': field.name,
            'evidenceType': evidenceType,
            'typeFidelity': typeFidelity,
          });
    });
};

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
            account:  database ? database.account : process.env["SNOWFLAKE_ACCOUNT"] || process.env["account"] || process.env["ACCOUNT"],
            username:  database ? database.username : process.env["SNOWFLAKE_USERNAME"] || process.env["username"] || process.env["USERNAME"],
            password:  database ? database.password : process.env["SNOWFLAKE_PASSWORD"] || process.env["password"] || process.env["PASSWORD"],
            database:  database ? database.database : process.env["SNOWFLAKE_DATABASE"] || process.env["database"] || process.env["DATABASE"],
            warehouse:  database ? database.warehouse : process.env["SNOWFLAKE_WAREHOUSE"] || process.env["warehouse"] || process.env["WAREHOUSE"]
        });

        const result = await execute(connection, queryString);
        const standardizedResults = await standardizeResult(result.rows);
        return { rows: standardizedResults, columnTypes : mapResultsToEvidenceColumnTypes(result) };
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