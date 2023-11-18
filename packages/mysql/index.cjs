const {
	getEnv,
	EvidenceType,
	TypeFidelity,
	asyncIterableToBatchedAsyncGenerator,
	cleanQuery
} = require('@evidence-dev/db-commons');
const mysql = require('mysql2');
const mysqlTypes = mysql.Types;

const envMap = {
	host: [
		{ key: 'EVIDENCE_MYSQL_HOST', deprecated: false },
		{ key: 'MYSQL_HOST', deprecated: false },
		{ key: 'host', deprecated: true },
		{ key: 'HOST', deprecated: true }
	],
	port: [
		{ key: 'EVIDENCE_MYSQL_PORT', deprecated: false },
		{ key: 'MYSQL_PORT', deprecated: false },
		{ key: 'port', deprecated: true },
		{ key: 'PORT', deprecated: true }
	],
	database: [
		{ key: 'EVIDENCE_MYSQL_DATABASE', deprecated: false },
		{ key: 'MYSQL_DATABASE', deprecated: false },
		{ key: 'database', deprecated: true },
		{ key: 'DATABASE', deprecated: true }
	],
	user: [
		{ key: 'EVIDENCE_MYSQL_USER', deprecated: false },
		{ key: 'MYSQL_USER', deprecated: false },
		{ key: 'user', deprecated: true },
		{ key: 'USER', deprecated: true }
	],
	socketPath: [
		{ key: 'EVIDENCE_MYSQL_SOCKETPATH', deprecated: false },
		{ key: 'MYSQL_SOCKETPATH', deprecated: false },
		{ key: 'socket_path', deprecated: true },
		{ key: 'SOCKETPATH', deprecated: true }
	],
	ssl: [
		{ key: 'EVIDENCE_MYSQL_SSL', deprecated: false },
		{ key: 'MYSQL_SSL', deprecated: false },
		{ key: 'ssl', deprecated: true },
		{ key: 'SSL', deprecated: true }
	]
};

/**
 *
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
const standardizeRow = (row) => {
	/** @type {Record<string, unknown>} */
	const lowerCasedRow = {};
	for (const [key, value] of Object.entries(row)) {
		lowerCasedRow[key.toLowerCase()] = value;
	}
	return lowerCasedRow;
};

/**
 *
 * @param {number} dataTypeId
 * @param {undefined} defaultType
 * @returns {EvidenceType | undefined}
 */
const nativeTypeToEvidenceType = function (dataTypeId, defaultType = undefined) {
	// No native bool https://stackoverflow.com/questions/289727/which-mysql-data-type-to-use-for-storing-boolean-values

	switch (dataTypeId) {
		case mysqlTypes['DECIMAL']:
		case mysqlTypes['TINY']:
		case mysqlTypes['SHORT']:
		case mysqlTypes['LONG']:
		case mysqlTypes['FLOAT']:
		case mysqlTypes['DOUBLE']:
		case mysqlTypes['NEWDECIMAL']:
		case mysqlTypes['INT24']:
		case mysqlTypes['LONGLONG']:
			return EvidenceType.NUMBER;
		case mysqlTypes['TIMESTAMP']:
		case mysqlTypes['DATE']:
		case mysqlTypes['TIME']:
		case mysqlTypes['DATETIME']:
		case mysqlTypes['YEAR']:
		case mysqlTypes['NEWDATE']:
			return EvidenceType.DATE;
		case mysqlTypes['VARCHAR']:
		case mysqlTypes['VAR_STRING']:
		case mysqlTypes['STRING']:
			return EvidenceType.STRING;
		case mysqlTypes['BIT']:
		case mysqlTypes['JSON']:
		case mysqlTypes['NULL']:
		case mysqlTypes['ENUM']:
		case mysqlTypes['SET']:
		case mysqlTypes['TINY_BLOB']:
		case mysqlTypes['MEDIUM_BLOB']:
		case mysqlTypes['LONG_BLOB']:
		case mysqlTypes['BLOB']:
		case mysqlTypes['GEOMETRY']:
		default:
			return defaultType;
	}
};

/**
 *
 * @param {mysql.FieldPacket[]} fields
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[] | undefined}
 */
const mapResultsToEvidenceColumnTypes = function (fields) {
	return fields?.map((field) => {
		/** @type {TypeFidelity} */
		let typeFidelity = TypeFidelity.PRECISE;
		let evidenceType = nativeTypeToEvidenceType(field.columnType);
		if (!evidenceType) {
			typeFidelity = TypeFidelity.INFERRED;
			evidenceType = EvidenceType.STRING;
		}
		return {
			// We use .toLowerCase() here to match the transformation of
			// rows in standardizeResult
			// If they do not match the results are rejected.
			name: field.name.toLowerCase(),
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

/** @type {import('@evidence-dev/db-commons').RunQuery<MySQLOptions>} */
const runQuery = async (queryString, database, batchSize = 100000) => {
	try {
		/** @type {import("mysql2").PoolOptions} */
		const credentials = {
			user: database ? database.user : getEnv(envMap, 'user'),
			host: database ? database.host : getEnv(envMap, 'host'),
			database: database ? database.database : getEnv(envMap, 'database'),
			password: database ? database.password : getEnv(envMap, 'password'),
			port: database ? database.port : getEnv(envMap, 'port'),
			socketPath: database ? database.socketPath : getEnv(envMap, 'socketPath'),
			decimalNumbers: true
		};

		const ssl_opt = database ? database.ssl : getEnv(envMap, 'ssl');

		if (ssl_opt === 'true') {
			credentials.ssl = {};
		} else if (ssl_opt === 'Amazon RDS') {
			credentials.ssl = 'Amazon RDS';
		} else if (!(ssl_opt === 'false' || ssl_opt === '' || ssl_opt === undefined)) {
			try {
				const obj = JSON.parse(ssl_opt);
				credentials.ssl = obj;
			} catch (e) {
				console.log(e);
			}
		}

		const connection = mysql.createConnection(credentials);

		const cleaned_query = cleanQuery(queryString);
		const count_query = `WITH root as (${cleaned_query}) SELECT COUNT(*) FROM root`;

		const expected_count = await connection
			.promise()
			.query(count_query)
			.catch(() => null);
		const expected_row_count = expected_count?.[0][0]['COUNT(*)'];

		const query = connection.query(queryString).stream();

		const fields = await new Promise((res) => query.on('fields', res));
		const result = await asyncIterableToBatchedAsyncGenerator(query, batchSize, { standardizeRow });
		result.columnTypes = mapResultsToEvidenceColumnTypes(fields);
		result.expectedRowCount = expected_row_count;

		return result;
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
 * @typedef {Object} MySQLOptions
 * @property {string} user
 * @property {string} host
 * @property {string} database
 * @property {string} password
 * @property {number} port
 * @property {string} socketPath
 * @property {number} decimalNumbers
 * @property {string} ssl
 */

/** @type {import('@evidence-dev/db-commons').GetRunner<MySQLOptions>} */
module.exports.getRunner = async (opts) => {
	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts, batchSize);
	};
};

/** @type {import('@evidence-dev/db-commons').ConnectionTester<PostgresOptions>} */
module.exports.testConnection = async (opts) => {
	return await runQuery('SELECT 1;', opts)
		.then(() => true)
		.catch((e) => ({ reason: e.message ?? 'Invalid Credentials' }));
};

module.exports.options = {
	host: {
		title: 'Hostname',
		type: 'string',
		required: true,
		secret: false
	},
	port: {
		title: 'Port',
		type: 'number',
		required: false,
		secret: false
	},
	database: {
		title: 'Database',
		type: 'string',
		required: true,
		secret: false
	},
	user: {
		title: 'Username',
		type: 'string',
		required: true,
		secret: false
	},
	password: {
		title: 'Password',
		type: 'string',
		required: true,
		secret: true
	},
	ssl: {
		title: 'SSL',
		type: 'string',
		required: false,
		secret: false
	},
	socketPath: {
		title: 'Socket Path',
		type: 'string',
		description:
			'This is an optional field. When using Google Cloud MySQL this is commonly required.',
		required: false,
		secret: false
	}
};
