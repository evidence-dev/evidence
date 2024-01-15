const {
	EvidenceType,
	TypeFidelity,
	asyncIterableToBatchedAsyncGenerator,
	cleanQuery,
	exhaustStream
} = require('@evidence-dev/db-commons');
const mssql = require('mssql');

/**
 *
 * @param {(() => mssql.ISqlType) | mssql.ISqlType} data_type
 * @param {undefined} defaultType
 * @returns {EvidenceType | undefined}
 */
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
			return EvidenceType.NUMBER;

		case mssql.TYPES.DateTime:
		case mssql.TYPES.SmallDateTime:
		case mssql.TYPES.DateTimeOffset:
		case mssql.TYPES.Date:
		case mssql.TYPES.DateTime2:
			return EvidenceType.DATE;

		case mssql.TYPES.VarChar:
		case mssql.TYPES.NVarChar:
		case mssql.TYPES.Char:
		case mssql.TYPES.NChar:
		case mssql.TYPES.Xml:
		case mssql.TYPES.Text:
		case mssql.TYPES.NText:
			return EvidenceType.STRING;

		case mssql.TYPES.Bit:
			return EvidenceType.BOOLEAN;

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

/**
 *
 * @param {mssql.IColumnMetadata} fields
 * @returns
 */
const mapResultsToEvidenceColumnTypes = function (fields) {
	return Object.values(fields).map((field) => {
		/** @type {TypeFidelity} */
		let typeFidelity = TypeFidelity.PRECISE;
		let evidenceType = nativeTypeToEvidenceType(field.type);
		if (!evidenceType) {
			typeFidelity = TypeFidelity.INFERRED;
			evidenceType = EvidenceType.STRING;
		}
		return {
			name: field.name,
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

/** @type {import("@evidence-dev/db-commons").RunQuery<MsSQLOptions>} */
const runQuery = async (queryString, database = {}, batchSize = 100000) => {
	try {
		const trust_server_certificate = database.trust_server_certificate ?? 'false';
		const encrypt = database.encrypt ?? 'true';
		const credentials = {
			user: database.user,
			server: database.host,
			database: database.database,
			password: database.password,
			port: parseInt(database.port ?? 1433),
			options: {
				trustServerCertificate: trust_server_certificate === 'true',
				encrypt: encrypt === 'true'
			}
		};

		const pool = await mssql.connect(credentials);

		const cleaned_string = cleanQuery(queryString);
		const expected_count = await pool
			.request()
			.query(`SELECT COUNT(*) as expected_row_count FROM (${cleaned_string}) as subquery`)
			.catch(() => null);
		const expected_row_count = expected_count?.recordset[0].expected_row_count;

		const request = new mssql.Request();
		request.stream = true;
		request.query(queryString);

		const columns = await new Promise((res) => request.once('recordset', res));

		const stream = request.toReadableStream();
		const results = await asyncIterableToBatchedAsyncGenerator(stream, batchSize, {
			closeConnection: () => pool.close()
		});
		results.columnTypes = mapResultsToEvidenceColumnTypes(columns);
		results.expectedRowCount = expected_row_count;

		return results;
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
	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts, batchSize);
	};
};

/** @type {import('@evidence-dev/db-commons').ConnectionTester<MsSQLOptions>} */
module.exports.testConnection = async (opts) => {
	return await runQuery('SELECT 1;', opts)
		.then(exhaustStream)
		.then(() => true)
		.catch((e) => ({ reason: e.message ?? 'Invalid Credentials' }));
};

module.exports.options = {
	server: {
		title: 'Host',
		secret: false,
		type: 'string',
		required: true
	},
	database: {
		title: 'Database',
		secret: false,
		type: 'string',
		required: true
	},
	user: {
		title: 'Username',
		secret: false,
		type: 'string',
		required: true
	},
	password: {
		title: 'Password',
		secret: true,
		type: 'string',
		required: true
	},
	port: {
		title: 'Port',
		secret: false,
		type: 'number',
		required: false
	},
	trust_server_certificate: {
		title: 'Trust Server Certificate',
		secret: false,
		type: 'boolean',
		description: 'Should be true for local dev / self-signed certificates',
		default: false
	},
	encrypt: {
		title: 'Encrypt',
		secret: false,
		type: 'boolean',
		default: false,
		description: 'Should be true when using azure'
	}
};
