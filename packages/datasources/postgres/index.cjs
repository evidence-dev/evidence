const pg = require('pg');
const { Pool } = pg;
const {
	EvidenceType,
	TypeFidelity,
	cleanQuery,
	exhaustStream
} = require('@evidence-dev/db-commons');
const Cursor = require('pg-cursor');

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
const runQuery = async (queryString, database, batchSize = 100000, closeBeforeResults = false) => {
	try {
		const credentials = {
			user: database.user,
			host: database.host,
			database: database.database,
			password: database.password,
			port: database.port,
			ssl: database.ssl,
			connectionString: database.connectionString,
			options: database.options
		};

		// Override types returned by pg package. The package will return some numbers as strings
		// to avoid loss of accuracy in very large numbers. This is something to keep an eye on,
		// but for now, we are replacing the default parsing functions with the applicable
		// JavaScript parsing function for each data type:
		var types = pg.types;

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

		// Override json / jsonb:
		types.setTypeParser(types.builtins.JSON, String);
		types.setTypeParser(types.builtins.JSONB, String);

		var pool = new Pool(credentials);

		// Set schema if specified. Can't be done using the connection string / credentials. See issue: https://github.com/brianc/node-postgres/issues/1123#issuecomment-501510375 & solution: https://node-postgres.com/apis/pool#events
		const schema = database.schema;
		if (schema) {
			pool.on('connect', (client) => {
				client.query(`SET search_path TO ${schema}`);
			});
		}

		/** @type {import("pg").Connection */
		const connection = await pool.connect();
		const cleanedString = cleanQuery(queryString);

		const lengthQuery = await connection
			.query(`WITH root as (${cleanedString}) SELECT COUNT(*) as rows FROM root`)
			.catch(() => undefined);
		const rowCount = lengthQuery.rows[0].rows;

		const cursor = connection.query(new Cursor(queryString));
		try {
			const firstBatch = await cursor.read(batchSize);

			return {
				rows: async function* () {
					try {
						yield standardizeResult(firstBatch);
						let results;
						while ((results = await cursor.read(batchSize)) && results.length > 0)
							yield standardizeResult(results);
						return;
					} finally {
						await connection.release();
						await pool.end();
					}
				},
				columnTypes: mapResultsToEvidenceColumnTypes(cursor._result),
				expectedRowCount: rowCount
			};
		} catch (e) {
			await connection.release();
			await pool.end();
			throw e;
		} finally {
			if (closeBeforeResults) {
				await cursor.close().catch(console.warn);
				await connection.release();
				await pool.end();
			}
		}
	} catch (err) {
		if (err.message) {
			throw new Error(err.message.replace(/\n|\r/g, ' '));
		} else if (typeof err === 'object') {
			throw new Error(JSON.stringify(err).replace(/\n|\r/g, ' '));
		} else {
			throw new Error(err.replace(/\n|\r/g, ' '));
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
 * @property {string} options
 */

/** @type {import('@evidence-dev/db-commons').GetRunner<PostgresOptions>} */
module.exports.getRunner = async (opts) => {
	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts, batchSize);
	};
};

/** @type {import('@evidence-dev/db-commons').ConnectionTester<PostgresOptions>} */
module.exports.testConnection = async (opts) => {
	return await runQuery('SELECT 1;', opts, 1, true)
		.then(exhaustStream)
		.then(() => true)
		.catch((e) => ({ reason: e.message ?? (e.toString() || 'Invalid Credentials') }));
};

module.exports.options = {
	host: {
		title: 'Host',
		type: 'string',
		secret: false,
		description: 'Database hostname to connect to',
		default: 'localhost',
		required: true
	},
	port: {
		title: 'Port',
		type: 'number',
		secret: false,
		description: 'Database port to connect to',
		default: 5432,
		required: true
	},
	database: {
		title: 'Database',
		type: 'string',
		secret: false,
		description: 'Database to connect to',
		default: 'postgres',
		required: true
	},
	user: {
		title: 'Username',
		type: 'string',
		secret: true,
		description: 'User to connect as',
		required: true
	},
	password: {
		title: 'Password',
		type: 'string',
		secret: true,
		description: 'Password',
		required: true
	},
	ssl: {
		title: 'Enable SSL',
		type: 'boolean',
		secret: false,
		description: 'Should SSL be used',
		nest: true,
		children: {
			[true]: {
				sslmode: {
					title: 'SSL Mode',
					type: 'select',
					secret: false,
					options: [
						'allow',
						'prefer',
						'require',
						{ value: 'verify-ca', label: 'Verify CA' },
						{ value: 'verify-full', label: 'Verify Full' }
					]
				},
				rejectUnauthorized: {
					title: 'Reject Unauthorized',
					type: 'boolean',
					default: true,
					secret: false,
					description:
						'When false, certificates with untrusted authorities will be accepted. Do not enable this unless you have to!'
				}
			}
		}
	},
	schema: {
		title: 'Schema',
		type: 'string',
		secret: false,
		description: 'Default schema'
	},
	options: {
		title: 'Options',
		type: 'string',
		secret: false,
		description: 'Connection options'
	}
};
