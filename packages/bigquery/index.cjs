const {
	BigQuery,
	BigQueryDate,
	BigQueryDatetime,
	BigQueryTime,
	BigQueryTimestamp,
	Geography
} = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const { EvidenceType, TypeFidelity, getEnv } = require('@evidence-dev/db-commons');

const envMap = {
	authenticator: [
		{ key: 'EVIDENCE_BIGQUERY_AUTHENTICATOR', deprecated: false },
		{ key: 'BIGQUERY_AUTHENTICATOR', deprecated: false }
	],
	projectId: [
		{ key: 'EVIDENCE_BIGQUERY_PROJECT_ID', deprecated: false },
		{ key: 'BIGQUERY_PROJECT_ID', deprecated: false },
		{ key: 'project_id', deprecated: true },
		{ key: 'PROJECT_ID', deprecated: true }
	],
	token: [
		{ key: 'EVIDENCE_BIGQUERY_TOKEN', deprecated: false },
		{ key: 'BIGQUERY_TOKEN', deprecated: false }
	],
	credentials: {
		clientEmail: [
			{ key: 'EVIDENCE_BIGQUERY_CLIENT_EMAIL', deprecated: false },
			{ key: 'BIGQUERY_CLIENT_EMAIL', deprecated: false },
			{ key: 'client_email', deprecated: true },
			{ key: 'CLIENT_EMAIL', deprecated: true }
		],
		privateKey: [
			{ key: 'EVIDENCE_BIGQUERY_PRIVATE_KEY', deprecated: false },
			{ key: 'BIGQUERY_PRIVATE_KEY', deprecated: false },
			{ key: 'private_key', deprecated: true },
			{ key: 'PRIVATE_KEY', deprecated: true }
		]
	}
};

/**
 * Standardizes the result of a BigQuery query
 * @param {Record<string, unknown>[]} result
 * @returns {Record<string, unknown>[]}
 */
const standardizeResult = (result) => {
	/** @type {Record<string, unknown>[]} */
	const output = [];
	result.forEach((row) => {
		/** @type {Record<string, unknown>} */
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
				standardized[key] = value.toString();
			} else if (typeof value?.toNumber === 'function') {
				standardized[key] = value.toNumber();
			}
		}
		output.push(standardized);
	});
	return output;
};

/**
 * @param {Partial<BigQueryOptions>} database
 * @returns {import("@google-cloud/bigquery").BigQueryOptions}
 */
const getCredentials = (database = {}) => {
	const authentication_method =
		database.authenticator ?? getEnv(envMap, 'authenticator') ?? 'service-account';

	if (authentication_method === 'gcloud-cli') {
		return {
			projectId: database.project_id ?? getEnv(envMap, 'projectId')
		};
	} else if (authentication_method === 'oauth') {
		const access_token = database.token ?? getEnv(envMap, 'token');
		const oauth = new OAuth2Client();
		oauth.setCredentials({ access_token });

		return {
			authClient: oauth,
			projectId: database.project_id ?? getEnv(envMap, 'projectId')
		};
	} else {
		return {
			projectId: database.project_id ?? getEnv(envMap, 'projectId'),
			credentials: {
				client_email: database.client_email ?? getEnv(envMap, 'credentials', 'clientEmail'),
				private_key: (database.private_key ?? getEnv(envMap, 'credentials', 'privateKey'))?.trim()
			}
		};
	}
};

/** @type {import("@evidence-dev/db-commons").RunQuery<BigQueryOptions>} */
const runQuery = async (queryString, database) => {
	try {
		const credentials = getCredentials(database);

		const connection = new BigQuery({ ...credentials, maxRetries: 10 });

		const [job] = await connection.createQueryJob({ query: queryString });
		const [rows] = await job.getQueryResults();
		const [, , response] = await job.getQueryResults({
			autoPaginate: false,
			wrapIntegers: false
		});
		const standardizedRows = standardizeResult(rows);
		return { rows: standardizedRows, columnTypes: mapResultsToEvidenceColumnTypes(response) };
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
const nativeTypeToEvidenceType = function (nativeFieldType) {
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
		case 'TIMESTAMP':
		case 'DATE':
		case 'DATETIME':
			return EvidenceType.DATE;
		case 'TIME':
		case 'STRING':
		case 'BYTES':
		case 'GEOGRAPHY':
		case 'INTERVAL':
		case 'STRUCT':
		case 'ARRAY':
		case 'JSON':
		default:
			return EvidenceType.STRING;
	}
};

/**
 *
 * @param {import("@google-cloud/bigquery").QueryRowsResponse[2]} results
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[] | undefined}
 */
const mapResultsToEvidenceColumnTypes = function (results) {
	return results?.schema?.fields?.map((field) => {
		const typeFidelity = TypeFidelity.PRECISE;
		const evidenceType = nativeTypeToEvidenceType(/** @type {string} */ (field.type));
		return {
			name: /** @type {string} */ (field.name),
			evidenceType,
			typeFidelity
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
	return async (queryContent, queryPath) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts);
	};
};
