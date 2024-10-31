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

const buildConfig = function (database) {
	const trust_server_certificate = database.trust_server_certificate ?? 'false';
	const encrypt = database.encrypt ?? 'true';
	const connection_timeout = database.connection_timeout ?? 15000;

	const credentials = {
		user: database.user,
		server: database.server,
		database: database.database,
		password: database.password,
		port: parseInt(database.port ?? 1433),
		connectionTimeout: parseInt(connection_timeout),
		options: {
			trustServerCertificate:
				trust_server_certificate === 'true' || trust_server_certificate === true,
			encrypt: encrypt === 'true' || encrypt === true
		}
	};

	if (database.authenticationType === 'default') {
		return credentials;
	} else if (database.authenticationType === 'azure-active-directory-default') {
		return credentials;
	} else if (database.authenticationType === 'azure-active-directory-access-token') {
		credentials.options.token = database.attoken;
		return credentials;
	} else if (database.authenticationType === 'azure-active-directory-password') {
		credentials.options = {
			userName: database.pwuname,
			password: database.pwpword,
			clientId: database.pwclientid,
			tenantId: database.pwtenantid
		};
		return credentials;
	} else if (database.authenticationType === 'azure-active-directory-service-principal-secret') {
		credentials.options = {
			clientId: database.spclientid,
			clientSecret: database.spclientsecret,
			tenantId: database.sptenantid
		};
		return credentials;
	}
};

/** @type {import("@evidence-dev/db-commons").RunQuery<MsSQLOptions>} */
const runQuery = async (queryString, database = {}, batchSize = 100000) => {
	try {
		const config = buildConfig(database);
		const pool = await mssql.connect(config);

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
 * @property {`${number}`} connection_timeout
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
	return await runQuery('SELECT 1 AS TEST;', opts) //
		.then(exhaustStream)
		.then(() => true)
		.catch((e) => ({ reason: e.message ?? (e.toString() || 'Invalid Credentials') }));
};

module.exports.options = {
	authenticationType: {
		title: 'Authentication type',
		type: 'select',
		secret: false,
		nest: false,
		required: true,
		default: 'sqlauth',
		options: [
			{
				value: 'default',
				label: 'SQL Login'
			},
			{
				value: 'azure-active-directory-default',
				label: 'DefaultAzureCredential'
			},
			{
				value: 'azure-active-directory-access-token',
				label: 'Access token'
			},
			{
				value: 'azure-active-directory-password',
				label: 'Entra ID User/Password'
			},
			{
				value: 'azure-active-directory-service-principal-secret',
				label: 'Service Principal Secret'
			}
		],
		children: {
			default: {
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
				}
			},
			'azure-active-directory-default': {},
			'azure-active-directory-access-token': {
				attoken: {
					title: 'Access Token',
					type: 'string',
					secret: true,
					required: true
				}
			},
			'azure-active-directory-password': {
				pwuname: {
					title: 'User',
					type: 'string',
					secret: false,
					required: true
				},
				pwpword: {
					title: 'Pstring',
					type: 'string',
					secret: true,
					required: true
				},
				pwclientid: {
					title: 'Client ID',
					type: 'string',
					secret: true,
					required: true
				},
				pwtenantid: {
					title: 'Tenant ID',
					type: 'string',
					secret: true,
					required: true
				}
			},
			'azure-active-directory-service-principal-secret': {
				spclientid: {
					title: 'Client ID',
					type: 'string',
					secret: true,
					required: true
				},
				spclientsecret: {
					title: 'Client Secret',
					type: 'string',
					secret: true,
					required: true
				},
				sptenantid: {
					title: 'Tenant ID',
					type: 'string',
					secret: true,
					required: true
				}
			}

			// TODO: authentication types that are not supported yet:
			// - tediousjs.github.io/tedious/api-connection.html
			// - [ ] ntlm
			// - [ ] azure-active-directory-msi-vm
			// - [ ] azure-active-directory-msi-app-service
			// - [x] default
			// - [x] azure-active-directory-default
			// - [x] azure-active-directory-password
			// - [x] azure-active-directory-access-token
			// - [x] azure-active-directory-service-principal-secret
		}
	},
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
	},
	connection_timeout: {
		title: 'Connection Timeout',
		secret: false,
		type: 'number',
		required: false,
		description: 'Connection timeout in ms'
	}
};
