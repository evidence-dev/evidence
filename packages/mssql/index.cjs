const { getEnv } = require('@evidence-dev/db-commons');
const mssql = require('mssql');

const envMap = {
	user: [
		{ key: 'EVIDENCE_MSSQL_USER', deprecated: false },
		{ key: 'MSSQL_USER', deprecated: false },
		{ key: 'user', deprecated: true },
		{ key: 'USER', deprecated: true }
	],
	host: [
		{ key: 'EVIDENCE_MSSQL_HOST', deprecated: false },
		{ key: 'MSSQL_HOST', deprecated: false },
		{ key: 'host', deprecated: true },
		{ key: 'HOST', deprecated: true }
	],
	database: [
		{ key: 'EVIDENCE_MSSQL_DATABASE', deprecated: false },
		{ key: 'MSSQL_DATABASE', deprecated: false },
		{ key: 'database', deprecated: true },
		{ key: 'DATABASE', deprecated: true }
	],
	password: [
		{ key: 'EVIDENCE_MSSQL_PASSWORD', deprecated: false },
		{ key: 'MSSQL_PASSWORD', deprecated: false },
		{ key: 'password', deprecated: true },
		{ key: 'PASSWORD', deprecated: true }
	],
	port: [
		{ key: 'EVIDENCE_MSSQL_PORT', deprecated: false },
		{ key: 'MSSQL_PORT', deprecated: false },
		{ key: 'port', deprecated: true },
		{ key: 'PORT', deprecated: true }
	],
	trustServerCertificate: [
		{ key: 'EVIDENCE_MSSQL_TRUST_SERVER_CERTIFICATE', deprecated: false },
		{ key: 'MSSQL_TRUST_SERVER_CERTIFICATE', deprecated: false },
		{ key: 'trust_server_certificate', deprecated: true },
		{ key: 'TRUST_SERVER_CERTIFICATE', deprecated: true }
	],
	encrypt: [
		{ key: 'EVIDENCE_MSSQL_ENCRYPT', deprecated: false },
		{ key: 'MSSQL_ENCRYPT', deprecated: false },
		{ key: 'encrypt', deprecated: true },
		{ key: 'ENCRYPT', deprecated: true }
	]
};

function nativeTypeToEvidenceType(data_type, defaultType = undefined) {
	switch (data_type) {
		case mssql.TYPES.Int:
		case mssql.TYPES.TinyInt:
		case mssql.TYPES.BigInt:
		case mssql.TYPES.SmallInt:
		case mssql.TYPES.Float:
		case mssql.TYPES.Real:
		case mssql.TYPES.Decimal:
		case mssql.TYPES.Numeric:
		case mssql.TYPES.SmallMoney:
		case mssql.TYPES.Money:
			return 'number';

		case mssql.TYPES.DateTime:
		case mssql.TYPES.SmallDateTime:
		case mssql.TYPES.DateTimeOffset:
		case mssql.TYPES.Date:
		case mssql.TYPES.DateTime2:
			return 'date';

		case mssql.TYPES.VarChar:
		case mssql.TYPES.NVarChar:
		case mssql.TYPES.Char:
		case mssql.TYPES.NChar:
		case mssql.TYPES.Xml:
		case mssql.TYPES.Text:
		case mssql.TYPES.NText:
			return 'string';

		case mssql.TYPES.Bit:
			return 'boolean';

		case mssql.TYPES.Time:
		case mssql.TYPES.UniqueIdentifier:
		case mssql.TYPES.Binary:
		case mssql.TYPES.VarBinary:
		case mssql.TYPES.Image:
		case mssql.TYPES.TVP:
		case mssql.TYPES.UDT:
		case mssql.TYPES.Geography:
		case mssql.TYPES.Geometry:
		case mssql.TYPES.Variant:
		default:
			return defaultType;
	}
}

const mapResultsToEvidenceColumnTypes = function (fields) {
	return Object.values(fields).map((field) => {
		let typeFidelity = 'precise';
		let evidenceType = nativeTypeToEvidenceType(field.type);
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

const runQuery = async (queryString, database = {}) => {
	try {
		const trust_server_certificate =
			database.trust_server_certificate ?? getEnv(envMap, 'trustServerCertificate') ?? 'false';
		const encrypt = database.encrypt ?? getEnv(envMap, 'encrypt') ?? 'true';
		const credentials = {
			user: database.user ?? getEnv(envMap, 'user'),
			server: database.host ?? getEnv(envMap, 'host'),
			database: database.database ?? getEnv(envMap, 'database'),
			password: database.password ?? getEnv(envMap, 'password'),
			port: parseInt(database.port ?? getEnv(envMap, 'port') ?? 1433),
			options: {
				trustServerCertificate: trust_server_certificate === 'true',
				encrypt: encrypt === 'true'
			}
		};

		const pool = await mssql.connect(credentials);
		const { recordset } = await pool.query(queryString);

		return { rows: recordset, columnTypes: mapResultsToEvidenceColumnTypes(recordset.columns) };
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
 * @typedef {Object} MsSQLOptions
 * @property {string} user
 * @property {string} host
 * @property {string} database
 * @property {string} password
 * @property {number} port
 * @property {boolean} trust_server_certificate
 * @property {boolean} encrypt
 */

/**
 * @typedef {Object} QueryResult
 * @property { Record<string, any>[] } rows
 * @property { { name: string, evidenceType: string, typeFidelity: string }[] } columnTypes
 */

/**
 * @param {MsSQLOptions} opts
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
