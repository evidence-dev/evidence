const { BigQuery } = require('@google-cloud/bigquery');
const { OAuth2Client } = require('google-auth-library');
const { EvidenceType, TypeFidelity } = require('@evidence-dev/db-commons');

const standardizeResult = async (result) => {
	var output = [];
	result.forEach((row) => {
		const standardized = {};
		for (const [key, value] of Object.entries(row)) {
			if (typeof value === 'object') {
				if (value) {
					if (value.value) {
						standardized[key] = value.value;
					} else {
						//This is a bigQuery specific workaround for https://github.com/evidence-dev/evidence/issues/792
						try {
							standardized[key] = Number(value);
						} catch (err) {
							standardized[key] = value;
						}
					}
				} else {
					standardized[key] = null;
				}
			} else {
				standardized[key] = value;
			}
		}
		output.push(standardized);
	});
	return output;
};

const getCredentials = (database = {}) => {
	const authentication_method =
		database.authenticator ??
		process.env['BIGQUERY_AUTHENTICATOR'] ??
		process.env['authenticator'] ??
		process.env['AUTHENTICATOR'];

	if (authentication_method === 'service-account') {
		return {
			projectId:
				database.project_id ??
				process.env['BIGQUERY_PROJECT_ID'] ??
				process.env['project_id'] ??
				process.env['PROJECT_ID'],
			credentials: {
				client_email:
					database.client_email ??
					process.env['BIGQUERY_CLIENT_EMAIL'] ??
					process.env['client_email'] ??
					process.env['CLIENT_EMAIL'],
				private_key: (
					database.private_key ??
					process.env['BIGQUERY_PRIVATE_KEY'] ??
					process.env['private_key'] ??
					process.env['PRIVATE_KEY']
				).replace(/\\n/g, '\n')
			}
		};
	} else if (authentication_method === 'oauth') {
		const access_token =
			database.token ??
			process.env['BIGQUERY_TOKEN'] ??
			process.env['token'] ??
			process.env['TOKEN'];
		const oauth = new OAuth2Client();
		oauth.setCredentials({ access_token });

		return {
			authClient: oauth,
			projectId:
				database.project_id ??
				process.env['BIGQUERY_PROJECT_ID'] ??
				process.env['project_id'] ??
				process.env['PROJECT_ID']
		};
	} else {
		return {
			projectId:
				database.project_id ??
				process.env['BIGQUERY_PROJECT_ID'] ??
				process.env['project_id'] ??
				process.env['PROJECT_ID']
		};
	}
};

const runQuery = async (queryString, database) => {
	try {
		const credentials = getCredentials(database);

		const connection = new BigQuery({ ...credentials, maxRetries: 10 });

		const [job] = await connection.createQueryJob({ query: queryString });
		const [rows] = await job.getQueryResults();
		const [, , response] = await job.getQueryResults({
			autoPaginate: false
		});
		const standardizedRows = await standardizeResult(rows);
		return { rows: standardizedRows, columnTypes: mapResultsToEvidenceColumnTypes(response) };
	} catch (err) {
		if (err.errors) {
			throw err.errors[0].message;
		} else {
			throw err.message;
		}
	}
};

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
		case 'STRING':
			return EvidenceType.STRING;
		case 'TIME':
		case 'TIMESTAMP':
		case 'DATE':
		case 'DATETIME':
			return EvidenceType.DATE;
		case 'STRUCT':
		case 'ARRAY':
		case 'BYTES':
		case 'GEOGRAPHY':
		case 'INTERVAL':
		case 'JSON':
		default:
			return defaultType;
	}
};

const mapResultsToEvidenceColumnTypes = function (results) {
	return results?.schema?.fields?.map((field) => {
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

module.exports = runQuery;
