const { getEnv } = require('@evidence-dev/db-commons');
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
			return 'number';
		case mysqlTypes['TIMESTAMP']:
		case mysqlTypes['DATE']:
		case mysqlTypes['TIME']:
		case mysqlTypes['DATETIME']:
		case mysqlTypes['YEAR']:
		case mysqlTypes['NEWDATE']:
			return 'date';
		case mysqlTypes['VARCHAR']:
		case mysqlTypes['VAR_STRING']:
		case mysqlTypes['STRING']:
			return 'string';
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

const mapResultsToEvidenceColumnTypes = function (fields) {
	return fields?.map((field) => {
		let typeFidelity = 'precise';
		let evidenceType = nativeTypeToEvidenceType(field.columnType);
		if (!evidenceType) {
			typeFidelity = 'inferred';
			evidenceType = 'string';
		}
		return {
			name: field.name,
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

const runQuery = async (queryString, database) => {
	try {
		let credentials = {
			user: database ? database.user : getEnv(envMap, 'user'),
			host: database ? database.host : getEnv(envMap, 'host'),
			database: database ? database.database : getEnv(envMap, 'database'),
			password: database ? database.password : getEnv(envMap, 'password'),
			port: database ? database.port : getEnv(envMap, 'port'),
			socketPath: database ? database.socketPath : getEnv(envMap, 'socketPath'),
			decimalNumbers: true
		};

		let ssl_opt = database ? database.ssl : getEnv(envMap, 'ssl');

		if (ssl_opt === 'true') {
			credentials = Object.assign(credentials, { ssl: {} });
		} else if (ssl_opt === 'Amazon RDS') {
			credentials = Object.assign(credentials, { ssl: 'Amazon RDS' });
		} else if (ssl_opt === 'false' || ssl_opt === '' || ssl_opt === undefined) {
			credentials = credentials;
		} else {
			try {
				let obj = JSON.parse(ssl_opt);
				credentials = Object.assign(credentials, { ssl: obj });
			} catch (e) {
				console.log(e);
			}
		}

		var pool = mysql.createPool(credentials);
		const promisePool = pool.promise();
		const [rows, fields] = await promisePool.query(queryString);

		const standardizedRows = await standardizeResult(rows);
		return { rows: standardizedRows, columnTypes: mapResultsToEvidenceColumnTypes(fields) };
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
 */

/**
 * @typedef {Object} QueryResult
 * @property { Record<string, any>[] } rows
 * @property { { name: string, evidenceType: string, typeFidelity: string }[] } columnTypes
 */

/**
 * @param {MySQLOptions} opts
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
