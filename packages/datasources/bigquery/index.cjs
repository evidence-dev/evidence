const {
	BigQuery,
	BigQueryDate,
	BigQueryDatetime,
	BigQueryTime,
	BigQueryTimestamp,
	Geography
} = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const {
	EvidenceType,
	TypeFidelity,
	asyncIterableToBatchedAsyncGenerator
} = require('@evidence-dev/db-commons');

/**
 * Standardizes a row from a BigQuery query
 * @param {Record<string, unknown>} result
 * @returns {Record<string, unknown>}
 */
const standardizeRow = (row) => {
	const standardized = {};
	for (const [key, value] of Object.entries(row)) {
		if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
			standardized[key] = value;
		} else if (
			value instanceof BigQueryDatetime ||
			value instanceof BigQueryTimestamp ||
			value instanceof BigQueryDate
		) {
			if (value instanceof BigQueryDatetime) value.value += 'Z';
			standardized[key] = new Date(value.value);
		} else if (value instanceof BigQueryTime || value instanceof Geography) {
			standardized[key] = value.value;
		} else if (value instanceof Buffer) {
			standardized[key] = value.toString('base64');
		} else if (typeof value?.toNumber === 'function') {
			standardized[key] = value.toNumber();
		}
	}
	return standardized;
};

/**
 * @param {Partial<BigQueryOptions>} database
 * @returns {import("@google-cloud/bigquery").BigQueryOptions}
 */
const getCredentials = (database = {}) => {
	const authentication_method = database.authenticator ?? 'service-account';

	if (authentication_method === 'gcloud-cli') {
		return {
			projectId: database.project_id,
			location: database.location
		};
	} else if (authentication_method === 'oauth') {
		const access_token = database.token;
		const oauth = new OAuth2Client();
		oauth.setCredentials({ access_token });

		return {
			authClient: oauth,
			projectId: database.project_id,
			location: database.location
		};
	} else {
		/* service-account */
		return {
			projectId: database.project_id,
			location: database.location,
			credentials: {
				client_email: database.client_email,
				private_key: database.private_key?.replace(/\\n/g, '\n').trim()
			}
		};
	}
};

/**
 *
 * @param {BigQueryOptions} db
 * @returns {BigQuery}
 */
const getConnection = (credentials) =>
	new BigQuery({ ...getCredentials(credentials), maxRetries: 10 });

/** @type {import("@evidence-dev/db-commons").RunQuery<BigQueryOptions>} */
const runQuery = async (queryString, database, batchSize = 100000) => {
	try {
		const connection = getConnection(database);

		const [job] = await connection.createQueryJob({ query: queryString });
		/** @type {import("node:stream").Transform} */
		const stream = connection.createQueryStream(queryString);
		const result = await asyncIterableToBatchedAsyncGenerator(stream, batchSize, {
			standardizeRow
		});

		const [, , response] = await job.getQueryResults({
			autoPaginate: false,
			wrapIntegers: false,
			maxResults: 0,
			timeoutMs: 3_600_000
		});
		result.columnTypes = mapResultsToEvidenceColumnTypes(response);
		result.expectedRowCount = response.totalRows && Number(response.totalRows);

		return result;
	} catch (err) {
		if (err.errors) {
			throw err.errors[0].message;
		} else {
			throw err.message;
		}
	}
};

/**
 *
 * @param {string} nativeFieldType
 * @param {undefined} defaultType
 * @returns {EvidenceType | undefined}
 */
const nativeTypeToEvidenceType = function (nativeFieldType, defaultType = undefined) {
	switch (nativeFieldType) {
		case 'BOOL':
		case 'BOOLEAN':
			return EvidenceType.BOOLEAN;
		case 'INT64':
		case 'INT':
		case 'SMALLINT':
		case 'INTEGER':
		case 'BIGINT':
		case 'TINYINT':
		case 'BYTEINT':
		case 'DECIMAL':
		case 'NUMERIC':
		case 'BIGDECIMAL':
		case 'BIGNUMERIC':
		case 'FLOAT64':
		case 'FLOAT':
			return EvidenceType.NUMBER;
		case 'TIME':
		case 'STRING':
		case 'BYTES':
		case 'GEOGRAPHY':
		case 'INTERVAL':
			return EvidenceType.STRING;
		case 'TIMESTAMP':
		case 'DATE':
		case 'DATETIME':
			return EvidenceType.DATE;
		case 'STRUCT':
		case 'ARRAY':
		case 'JSON':
		default:
			return defaultType;
	}
};

/**
 *
 * @param {import("@google-cloud/bigquery").QueryRowsResponse[2]} results
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[] | undefined}
 */
const mapResultsToEvidenceColumnTypes = function (results) {
	return results?.schema?.fields?.map((field) => {
		/** @type {TypeFidelity} */
		let typeFidelity = TypeFidelity.PRECISE;
		let evidenceType = nativeTypeToEvidenceType(/** @type {string} */ (field.type));
		if (!evidenceType) {
			typeFidelity = TypeFidelity.INFERRED;
			evidenceType = EvidenceType.STRING;
		}
		return {
			name: /** @type {string} */ (field.name),
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

module.exports = runQuery;
/**
 * @typedef {Object} BigQueryBaseOptions
 * @property {string} project_id
 */

/**
 * @typedef {Object} BigQueryServiceAccountOptions
 * @property {'service-account'} authenticator
 * @property {string} client_email
 * @property {string} private_key
 */

/**
 * @typedef {Object} BigQueryOauthOptions
 * @property {'oauth'} authenticator
 * @property {string} token
 */

/**
 * @typedef {Object} BigQueryCliOptions
 * @property {'gcloud-cli'} authenticator
 */

/**
 * @typedef {BigQueryBaseOptions & (BigQueryServiceAccountOptions | BigQueryOauthOptions | BigQueryCliOptions)} BigQueryOptions
 */

/** @type {import("@evidence-dev/db-commons").GetRunner<BigQueryOptions>} */
module.exports.getRunner = async (opts) => {
	return async (queryContent, queryPath, batchSize) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts, batchSize);
	};
};
/** @type {import('@evidence-dev/db-commons').ConnectionTester<BigQueryOptions>} */
module.exports.testConnection = async (opts) => {
	const conn = getConnection(opts);
	return await conn
		.query('SELECT 1;')
		.then(() => true)
		.catch((e) => {
			if (e instanceof Error) return { reason: e.message };
			try {
				return { reason: JSON.stringify(e) };
			} catch {
				return { reason: 'Unknown Connection Error' };
			}
		});
};

module.exports.options = {
	project_id: {
		title: 'Project ID',
		type: 'string',
		secret: true,
		required: true,
		references: '$.keyfile.project_id',
		forceReference: false
	},
	location: {
		title: 'Location (Region)',
		type: 'string',
		secret: false,
		required: false,
		default: 'US'
	},
	authenticator: {
		title: 'Authentication Method',
		type: 'select',
		secret: false,
		nest: false,
		required: true,
		default: 'service-account',
		options: [
			{
				value: 'service-account',
				label: 'Service Account'
			},
			{
				value: 'gcloud-cli',
				label: 'GCloud CLI'
			},
			{
				value: 'oauth',
				label: 'OAuth Access Token'
			}
		],
		children: {
			'service-account': {
				keyfile: {
					title: 'Credentials File',
					type: 'file',
					fileFormat: 'json',
					virtual: true
				},
				client_email: {
					title: 'Client Email',
					type: 'string',
					secret: true,
					required: true,
					references: '$.keyfile.client_email',
					forceReference: true
				},
				private_key: {
					title: 'Private Key',
					type: 'string',
					secret: true,
					required: true,
					references: '$.keyfile.private_key',
					forceReference: true
				}
			},
			'gcloud-cli': {
				/* no-op; only needs projectId */
			},
			oauth: {
				token: {
					type: 'string',
					title: 'Token',
					secret: true,
					required: true
				}
			}
		}
	}
};
