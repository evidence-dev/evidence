const { number } = require('echarts');
const mysql = require('mysql2');
const mysqlTypes = mysql.Types;
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

const nativeTypeToEvidenceType = function (dataTypeId, defaultType = undefined) {
    // No native bool https://stackoverflow.com/questions/289727/which-mysql-data-type-to-use-for-storing-boolean-values
    
    switch (dataTypeId) {
        case mysqlTypes["DECIMAL"]:
        case mysqlTypes["TINY"]:
        case mysqlTypes["SHORT"]:
        case mysqlTypes["LONG"]:
        case mysqlTypes["FLOAT"]:
        case mysqlTypes["DOUBLE"]:
        case mysqlTypes["NEWDECIMAL"]:
        case mysqlTypes["INT24"]:
        case mysqlTypes["LONGLONG"]:
            return 'number';
        case mysqlTypes["TIMESTAMP"]:
        case mysqlTypes["DATE"]:
        case mysqlTypes["TIME"]:
        case mysqlTypes["DATETIME"]:
        case mysqlTypes["YEAR"]:
        case mysqlTypes["NEWDATE"]:
            return 'date';
        case mysqlTypes["VARCHAR"]:
        case mysqlTypes["VAR_STRING"]:
        case mysqlTypes["STRING"]:  
            return 'string'   
        case mysqlTypes["BIT"]:
        case mysqlTypes["JSON"]:
        case mysqlTypes["NULL"]:
        case mysqlTypes["ENUM"]:
        case mysqlTypes["SET"]:
        case mysqlTypes["TINY_BLOB"]:
        case mysqlTypes["MEDIUM_BLOB"]:
        case mysqlTypes["LONG_BLOB"]:
        case mysqlTypes["BLOB"]:
        case mysqlTypes["GEOMETRY"]:
        default:
            return defaultType;
    }
};

const mapResultsToEvidenceColumnTypes = function (fields) {
    return fields?.map(field => {
        let typeFidelity = 'precise';
        let evidenceType = nativeTypeToEvidenceType(field.columnType);
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

const runQuery = async (queryString, database) => {
    try {
        const credentials = {
            user: database ? database.user : process.env["MYSQL_USER"] || process.env["user"] || process.env["USER"],
            host: database ? database.host : process.env["MYSQL_HOST"] || process.env["host"] || process.env["HOST"],
            database: database ? database.database : process.env["MYSQL_DATABASE"] || process.env["database"] || process.env["DATABASE"],
            password: database ? database.password : process.env["MYSQL_PASSWORD"] || process.env["password"] || process.env["PASSWORD"],
            port: database ? database.port : process.env["MYSQL_PORT"] || process.env["port"] || process.env["PORT"],
            socketPath: database ? database.socketPath : process.env["MYSQL_SOCKETPATH"] || process.env["socketPath"] || process.env["SOCKETPATH"],
            decimalNumbers: true
        }
        
        let ssl_opt = database ? database.ssl : process.env["MYSQL_SSL"] || process.env["ssl"] || process.env["SSL"]
        
        if (ssl_opt === "true") {
            credentials = Object.assign(credentials, {ssl: {}});
        } else if (ssl_opt === "Amazon RDS") {
            credentials = Object.assign(credentials, {ssl: 'Amazon RDS'});
        } else if (ssl_opt === 'false' || ssl_opt === '' || ssl_opt === undefined) {
            credentials = credentials
        } else {
            try {
                let obj = JSON.parse(ssl_opt);
                credentials = Object.assign(credentials, {ssl: obj});
            } catch (e) {
                console.log(e)
            }
        }

        var pool = mysql.createPool(credentials);
        const promisePool = pool.promise();
        const [rows, fields] = await promisePool.query(queryString);

        const standardizedRows = await standardizeResult(rows);
        return { rows: standardizedRows, columnTypes : mapResultsToEvidenceColumnTypes(fields) };

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
