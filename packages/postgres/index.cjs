const pg = require('pg');
const { Pool } = pg;
const { EvidenceType, getEnv } = require('@evidence-dev/db-commons');

const envMap = {
	host: [
		{ key: 'EVIDENCE_POSTGRES_HOST', deprecated: false },
		{ key: 'POSTGRES_HOST', deprecated: false },
		{ key: 'host', deprecated: true },
		{ key: 'HOST', deprecated: true }
	],
	port: [
		{ key: 'EVIDENCE_POSTGRES_PORT', deprecated: false },
		{ key: 'POSTGRES_PORT', deprecated: false },
		{ key: 'port', deprecated: true },
		{ key: 'PORT', deprecated: true }
	],
	database: [
		{ key: 'EVIDENCE_POSTGRES_DATABASE', deprecated: false },
		{ key: 'POSTGRES_DATABASE', deprecated: false },
		{ key: 'database', deprecated: true },
		{ key: 'DATABASE', deprecated: true }
	],
	user: [
		{ key: 'EVIDENCE_POSTGRES_USER', deprecated: false },
		{ key: 'POSTGRES_USER', deprecated: false },
		{ key: 'user', deprecated: true },
		{ key: 'USER', deprecated: true }
	],
	password: [
		{ key: 'EVIDENCE_POSTGRES_PASSWORD', deprecated: false },
		{ key: 'POSTGRES_PASSWORD', deprecated: false },
		{ key: 'password', deprecated: true },
		{ key: 'PASSWORD', deprecated: true }
	],
	ssl: [
		{ key: 'EVIDENCE_POSTGRES_SSL', deprecated: false },
		{ key: 'POSTGRES_SSL', deprecated: false },
		{ key: 'ssl', deprecated: true },
		{ key: 'SSL', deprecated: true }
	],
	connString: [
		{ key: 'EVIDENCE_POSTGRES_CONNECTIONSTRING', deprecated: false },
		{ key: 'POSTGRES_CONNECTIONSTRING', deprecated: false },
		{ key: 'CONNECTIONSTRING', deprecated: true },
		{ key: 'connectionString', deprecated: true }
	],
	schema: [
		{ key: 'EVIDENCE_POSTGRES_SCHEMA', deprecated: false },
		{ key: 'POSTGRES_SCHEMA', deprecated: true },
		{ key: 'schema', deprecated: true },
		{ key: 'SCHEMA', deprecated: true }
	]
};

/**
 * Some types that are not defined in the PG library
 */
const pgBuiltInTypeExtentions = {
	CHAR: 18,
	JSON: 114,
	JSONB: 3802,
	XML: 142,
	UUID: 2950,
	NAME: 19,
	JSONPATH: 4072,
	//arrays of type
	_XML: 143,
	_JSON: 199,
	_MONEY: 791,
	_BOOL: 1000,
	_CHAR: 1002
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
	return results?.fields?.map((field) => {
		let typeFidelity = 'precise';
		let evidenceType = nativeTypeToEvidenceType(field.dataTypeID);
		if (!evidenceType) {
			typeFidelity = 'inferred';
			evidenceType = EvidenceType.STRING;
		}
		return {
			name: field.name.toLowerCase(),
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

const standardizeResult = async (result) => {
	var output = [];
	result.forEach((row) => {
		const lowerCasedRow = {};
		for (const [key, value] of Object.entries(row)) {
			lowerCasedRow[key.toLowerCase()] = value;
		}
		output.push(lowerCasedRow);
	});
	return output;
};

const runQuery = async (queryString, database) => {
	try {
		const credentials = {
			user: database ? database.user : getEnv(envMap, 'user'),
			host: database ? database.host : getEnv(envMap, 'host'),
			database: database ? database.database : getEnv(envMap, 'database'),
			password: database ? database.password : getEnv(envMap, 'password'),
			port: database ? database.port : getEnv(envMap, 'port'),
			ssl: database ? database.ssl : getEnv(envMap, 'ssl'),
			connectionString: database ? database.connectionString : getEnv(envMap, 'connString')
		};

		// Override types returned by pg package. The package will return some numbers as strings
		// to avoid loss of accuracy in very large numbers. This is something to keep an eye on,
		// but for now, we are replacing the default parsing functions with the applicable
		// JavaScript parsing function for each data type:
		var types = require('pg').types;

		// Override bigint:
		types.setTypeParser(20, function (val) {
			return parseInt(val, 10);
		});

		// Override numeric/decimal:
		types.setTypeParser(1700, function (val) {
			return parseFloat(val);
		});

		// Override money (incl. removing currency symbol):
		types.setTypeParser(790, function (val) {
			return parseFloat(val.replace(/[^0-9.]/g, ''));
		});

		var pool = new Pool(credentials);

		// Set schema if specified. Can't be done using the connection string / credentials. See issue: https://github.com/brianc/node-postgres/issues/1123#issuecomment-501510375 & solution: https://node-postgres.com/apis/pool#events
		const schema = database ? database.schema : getEnv(envMap, 'schema');
		if (schema) {
			pool.on('connect', (client) => {
				client.query(`SET search_path TO ${schema}`);
			});
		}
		var result = await pool.query(queryString);

		const standardizedRows = await standardizeResult(result.rows);

		return { rows: standardizedRows, columnTypes: mapResultsToEvidenceColumnTypes(result) };
	} catch (err) {
		if (err.message) {
			throw err.message.replace(/\n|\r/g, ' ');
		} else {
			throw err.replace(/\n|\r/g, ' ');
		}
	}
};

module.exports = runQuery;

/**
 * @typedef {Object} PostgresOptions
 * @property {string} host
 * @property {string} database
 * @property {string} user
 * @property {string} password
 * @property {number} port
 * @property {Object | undefined} ssl
 */

/**
 * @typedef {Object} QueryResult
 * @property { Record<string, any>[] } rows
 * @property { { name: string, evidenceType: string, typeFidelity: string }[] } columnTypes
 */

/**
 * @param {PostgresOptions} opts
 * @returns { (queryString: string, queryOpts: PostgresOptions ) => Promise<QueryResult> }
 */
module.exports.getRunner = async (opts) => {
	/**
	 * @param {string} queryContent
	 * @param {string} queryPath
	 * @returns {Promise<QueryResult>}
	 */
	return async (queryContent, queryPath) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts);
	};
};
