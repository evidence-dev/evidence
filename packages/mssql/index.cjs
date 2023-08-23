const {
	getEnv,
	EvidenceType,
	TypeFidelity,
	convertStringColumns,
	convertNumberColumns
} = require('@evidence-dev/db-commons');
const mssql = require('mssql');
const TYPES = mssql.TYPES;

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

/**
 *
 * @param {(() => mssql.ISqlType) | mssql.ISqlType} data_type
 * @returns {EvidenceType | undefined}
 */
function nativeTypeToEvidenceType(data_type) {
	switch (data_type) {
		case TYPES.Int:
		case TYPES.TinyInt:
		case TYPES.BigInt:
		case TYPES.SmallInt:
		case TYPES.Float:
		case TYPES.Real:
		case TYPES.Decimal:
		case TYPES.Numeric:
		case TYPES.SmallMoney:
		case TYPES.Money:
			return EvidenceType.NUMBER;

		case TYPES.Bit:
			return EvidenceType.BOOLEAN;

		case TYPES.DateTime:
		case TYPES.SmallDateTime:
		case TYPES.DateTimeOffset:
		case TYPES.Date:
		case TYPES.DateTime2:
		case TYPES.Time:
			return EvidenceType.DATE;

		case TYPES.VarChar:
		case TYPES.NVarChar:
		case TYPES.Char:
		case TYPES.NChar:
		case TYPES.Xml:
		case TYPES.Text:
		case TYPES.NText:
		case TYPES.Binary:
		case TYPES.VarBinary:
		case TYPES.Image:
		case TYPES.UniqueIdentifier:
		case TYPES.Variant:
		default:
			return EvidenceType.STRING;
	}
}

/**
 *
 * @param {mssql.IColumnMetadata} fields
 * @returns
 */
const mapResultsToEvidenceColumnTypes = function (fields) {
	return Object.values(fields).map((field) => {
		/** @type {TypeFidelity} */
		const typeFidelity = TypeFidelity.PRECISE;
		const evidenceType = nativeTypeToEvidenceType(field.type);
		return {
			name: field.name,
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

/** @type {import("@evidence-dev/db-commons").RunQuery<MsSQLOptions>} */
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

		/** @type {mssql.ConnectionPool} */
		const pool = await mssql.connect(credentials);
		const { recordset } = await pool.query(queryString);

		const columnTypes = mapResultsToEvidenceColumnTypes(recordset.columns);
		const convertedStringRows = convertStringColumns(recordset, columnTypes);
		const convertedBigIntRows = convertNumberColumns(convertedStringRows, columnTypes);

		return { rows: convertedBigIntRows, columnTypes };
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
 * @property {`${number}`} port
 * @property {`${boolean}`} trust_server_certificate
 * @property {`${boolean}`} encrypt
 */

/** @type {import('@evidence-dev/db-commons').GetRunner<MsSQLOptions>} */
module.exports.getRunner = async (opts) => {
	return async (queryContent, queryPath) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts);
	};
};
