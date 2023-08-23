const { getEnv, EvidenceType, TypeFidelity, convertStringColumns } = require('@evidence-dev/db-commons');
const mysql = require('mysql2');
const Types = mysql.Types;

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
 * @param {mysql.RowDataPacket[]} result
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

/**
 *
 * @param {typeof Types[keyof typeof Types]} dataTypeId
 * @returns {EvidenceType}
 */
const nativeTypeToEvidenceType = function (dataTypeId) {
	// No native bool https://stackoverflow.com/questions/289727/which-mysql-data-type-to-use-for-storing-boolean-values

	// based on mysql2/lib/parsers/binary_parser.js
	switch (dataTypeId) {
		case Types.TINY:
		case Types.SHORT:
		case Types.LONG:
		case Types.INT24:
		case Types.YEAR:
		case Types.FLOAT:
		case Types.DOUBLE:
		case Types.DECIMAL:
		case Types.NEWDECIMAL:
		case Types.LONGLONG:
			return EvidenceType.NUMBER;
		case Types.DATE:
		case Types.DATETIME:
		case Types.TIMESTAMP:
		case Types.NEWDATE:
			return EvidenceType.DATE;
		case Types.NULL:
		case Types.TIME:
		case Types.GEOMETRY:
		case Types.JSON:
		default:
			return EvidenceType.STRING;
	}
};

/**
 *
 * @param {mysql.FieldPacket[]} fields
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[] | undefined}
 */
const mapResultsToEvidenceColumnTypes = function (fields) {
	return fields?.map((field) => {
		const typeFidelity = TypeFidelity.PRECISE;
		const evidenceType = nativeTypeToEvidenceType(field.columnType);
		return {
			name: field.name,
			evidenceType,
			typeFidelity
		};
	});
};

/** @type {import('@evidence-dev/db-commons').RunQuery<MySQLOptions>} */
const runQuery = async (queryString, database) => {
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
				credentials.ssl = JSON.parse(ssl_opt);
			} catch (e) {
				console.log(e);
			}
		}

		const pool = mysql.createPool(credentials);
		const promisePool = pool.promise();
		const [result, fields] = await promisePool.query(queryString);

		const columnTypes = mapResultsToEvidenceColumnTypes(fields);
		const standardizedRows = standardizeResult(result);
		const rows = convertStringColumns(standardizedRows, columnTypes);

		return { rows, columnTypes };
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
	return async (queryContent, queryPath) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts);
	};
};
