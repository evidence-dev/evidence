const pg = require('pg');
const { Pool } = pg;
const { EvidenceType, getEnv, TypeFidelity } = require('@evidence-dev/db-commons');
const Cursor = require('pg-cursor');

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

/**
 * Extracts the union of values of an object type
 * @template T
 * @typedef {T[keyof T]} MemberOf
 */

/**
 *
 * @param {MemberOf<(typeof pg)["types"]["builtins"]>} dataTypeId
 * @param {undefined} defaultType
 * @returns {EvidenceType | undefined}
 */
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
		case pg.types.builtins.CHAR:
		case pg.types.builtins.JSON:
		case pg.types.builtins.XML:
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

/**
 *
 * @param {pg.QueryResult} results
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[] | undefined}
 */
const mapResultsToEvidenceColumnTypes = function (results) {
	return results?.fields?.map((field) => {
		/** @type {TypeFidelity} */
		let typeFidelity = TypeFidelity.PRECISE;
		let evidenceType = nativeTypeToEvidenceType(field.dataTypeID);
		if (!evidenceType) {
			typeFidelity = TypeFidelity.INFERRED;
			evidenceType = EvidenceType.STRING;
		}
		return {
			name: field.name.toLowerCase(),
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

/**
 *
 * @param {Record<string, unknown>[]} result
 * @returns {Record<string, unknown>[]}
 */
const standardizeResult = (result) => {
	/** @type {Record<string, unknown>[]} */
	const output = [];
	result.forEach((row) => {
		/** @type {Record<string, unknown>} */
		const lowerCasedRow = {};
		for (const [key, value] of Object.entries(row)) {
			lowerCasedRow[key.toLowerCase()] = value;
		}
		output.push(lowerCasedRow);
	});
	return output;
};

/** @type {import('@evidence-dev/db-commons').RunQuery<PostgresOptions>} */
const runQuery = async (queryString, database, batchSize) => {
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


		const connection = await pool.connect();
		try {
			let cleanedString = queryString.trim()
			if (cleanedString.endsWith(";")) cleanedString = cleanedString.substring(0, cleanedString.length - 1)

			const lengthQuery = await connection.query(`WITH root as (${cleanedString}) SELECT COUNT(*) as rows FROM root`).catch(() => undefined)
			const rowCount = lengthQuery.rows[0].rows

			const cursor = connection.query(new Cursor(queryString));

			const rowsPerBatch = batchSize ?? 100000;
			const firstBatch = await cursor.read(rowsPerBatch);

			return {
				rows: async function* () {
					yield firstBatch;
					let results;
					while ((results = await cursor.read(rowsPerBatch)) && results.length > 0) yield results;
					connection.release();
					pool.end();
				},
				columnTypes: mapResultsToEvidenceColumnTypes(cursor._result),
				expectedRowCount: rowCount
			};
		} catch (e) {
			await connection.release();
			await pool.end();
			throw e;
		}
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
 * @property {string} connectionString
 * @property {string} schema
 */

/** @type {import('@evidence-dev/db-commons').GetRunner<PostgresOptions>} */
module.exports.getRunner = async (opts) => {
	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts, batchSize);
	};
};
