const mssql = require('mssql');

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

const runQuery = async (queryString, database) => {
	try {
		const trust_server_certificate =
			process.env['MSSQL_TRUST_SERVER_CERTIFICATE'] ??
			process.env['trust_server_certificate'] ??
			process.env['TRUST_SERVER_CERTIFICATE'] ??
			'false';
		const encrypt =
			process.env['MSSQL_ENCRYPT'] ?? process.env['encrypt'] ?? process.env['ENCRYPT'] ?? 'true';
		const credentials = {
			user: database
				? database.user
				: process.env['MSSQL_USER'] || process.env['user'] || process.env['USER'],
			server: database
				? database.host
				: process.env['MSSQL_HOST'] || process.env['host'] || process.env['HOST'],
			database: database
				? database.database
				: process.env['MSSQL_DATABASE'] || process.env['database'] || process.env['DATABASE'],
			password: database
				? database.password
				: process.env['MSSQL_PASSWORD'] || process.env['password'] || process.env['PASSWORD'],
			port: database
				? database.port
				: process.env['MSSQL_PORT'] || process.env['port'] || process.env['PORT'],
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
