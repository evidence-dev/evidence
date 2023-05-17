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

const runQuery = async (queryString, database) => {
	try {
		const trust_server_certificate =
			database?.trust_server_certificate ??
			process.env['MSSQL_TRUST_SERVER_CERTIFICATE'] ??
			process.env['trust_server_certificate'] ??
			process.env['TRUST_SERVER_CERTIFICATE'] ??
			'false';
		const encrypt =
			database?.encrypt ??
			process.env['MSSQL_ENCRYPT'] ??
			process.env['encrypt'] ??
			process.env['ENCRYPT'] ??
			'true';
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
			port: parseInt(
				database?.port ??
					process.env['MSSQL_PORT'] ??
					process.env['port'] ??
					process.env['PORT'] ??
					1433
			),
			options: {
				trustServerCertificate: trust_server_certificate === 'true',
				encrypt: encrypt === 'true',
				authentication: {
					type:
						database?.authentication_method ??
						process.env['MSSQL_AUTHENTICATION_METHOD'] ??
						process.env['authentication_method'] ??
						process.env['AUTHENTICATION_METHOD'] ??
						'default',
					options: {
						clientId:
							database?.client_id ??
							process.env['MSSQL_CLIENT_ID'] ??
							process.env['client_id'] ??
							process.env['CLIENT_ID'],
						clientSecret:
							database?.client_secret ??
							process.env['MSSQL_CLIENT_SECRET'] ??
							process.env['client_secret'] ??
							process.env['CLIENT_SECRET'],
						tenantId:
							database?.tenant_id ??
							process.env['MSSQL_TENANT_ID'] ??
							process.env['tenant_id'] ??
							process.env['TENANT_ID'],
						msiEndpoint:
							database?.msi_endpoint ??
							process.env['MSSQL_MSI_ENDPOINT'] ??
							process.env['msi_endpoint'] ??
							process.env['MSI_ENDPOINT'],
						msiSecret:
							database?.msi_secret ??
							process.env['MSSQL_MSI_SECRET'] ??
							process.env['msi_secret'] ??
							process.env['MSI_SECRET'],
						token:
							database?.token ??
							process.env['MSSQL_TOKEN'] ??
							process.env['token'] ??
							process.env['TOKEN'],
						userName:
							database?.username ??
							process.env['MSSQL_USERNAME'] ??
							process.env['username'] ??
							process.env['USERNAME'],
						password:
							database?.password ??
							process.env['MSSQL_PASSWORD'] ??
							process.env['password'] ??
							process.env['PASSWORD']
					}
				}
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
