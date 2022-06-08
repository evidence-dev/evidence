const pg = require('pg');
const { Pool } = pg;
const { EvidenceType } = require('@evidence-dev/db-commons');

/**
 * Some types that are not defined in the PG library
 */
const pgBuiltInTypeExtentions = {
    'CHAR': 18,
    'JSON': 114,
    'JSONB': 3802,
    'XML': 142,
    'UUID': 2950,
    'NAME': 19,
    'JSONPATH': 4072,
    //arrays of type
    '_XML': 143,
    '_JSON': 199,
    '_MONEY': 791,
    '_BOOL': 1000,
    '_CHAR': 1002
};
const nativeTypeToEvidenceType = function (dataTypeId, defaultType = undefined) {
    switch (dataTypeId) {
        case pg.types.builtins.BOOL:
            return EvidenceType.BOOLEAN;
        case pg.types.builtins.NUMERIC:
        case pg.types.builtins.MONEY:
        case pg.types.builtins.INT2:
        case pg.types.builtins.INT4:
        case pg.types.builtins.INT8:
        case pg.types.builtins.FLOAT4:
        case pg.types.builtins.FLOAT8:
            return EvidenceType.NUMBER;
        case pg.types.builtins.VARCHAR:
        case pg.types.builtins.TEXT:
        case pg.types.builtins.STRING:
        case pgBuiltInTypeExtentions.CHAR:
        case pgBuiltInTypeExtentions.JSON:
        case pgBuiltInTypeExtentions.XML:
        case pgBuiltInTypeExtentions.NAME:
            return EvidenceType.STRING;
        case pg.types.builtins.DATE:
        case pg.types.builtins.TIME:
        case pg.types.builtins.TIMETZ:
        case pg.types.builtins.TIMESTAMP:
        case pg.types.builtins.TIMESTAMPTZ:
            return EvidenceType.DATE;
        default:
            return defaultType;
    }
};

const mapResultsToEvidenceColumnTypes = function (results) {
    return results?.fields?.map(field => {
        let typeFidelity = 'precise';
        let evidenceType = nativeTypeToEvidenceType(field.dataTypeID);
        if (!evidenceType) {
            typeFidelity = 'inferred';
            evidenceType = EvidenceType.STRING;
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
        const credentials =  {
            user: database ? database.user : process.env["POSTGRES_USER"] || process.env["user"] || process.env["USER"],
            host: database ? database.host : process.env["POSTGRES_HOST"] || process.env["host"] || process.env["HOST"],
            database: database ? database.database : process.env["POSTGRES_DATABASE"] || process.env["database"] || process.env["DATABASE"],
            password: database ? database.password : process.env["POSTGRES_PASSWORD"] || process.env["password"] || process.env["PASSWORD"],
            port: database ? database.port : process.env["POSTGRES_PORT"] || process.env["port"] || process.env["PORT"],
            ssl: database ? database.ssl : process.env["POSTGRES_SSL"] || process.env["ssl"] || process.env["SSL"],
            connectionString: database ? database.connectionString : process.env["POSTGRES_CONNECTIONSTRING"] || process.env["connectionString"] || process.env["CONNECTIONSTRING"]
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

        const standardizedRows = await standardizeResult(result.rows);

        return { rows: standardizedRows, columnTypes : mapResultsToEvidenceColumnTypes(result) };
    } catch (err) {
        if (err.message) {
            throw err.message.replace(/\n|\r/g, " ")
        } else {
            throw err.replace(/\n|\r/g, " ")
        }
    }
}

module.exports = runQuery