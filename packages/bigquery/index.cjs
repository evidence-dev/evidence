const { BigQuery } = require('@google-cloud/bigquery');
const { EvidenceType, TypeFidelity, getEnv } = require('@evidence-dev/db-commons');

const envMap = {
	projectId: [
		{ key: 'EVIDENCE_BIGQUERY_PROJECT_ID', deprecated: false },
		{ key: 'BIGQUERY_PROJECT_ID', deprecated: false },
		{ key: 'project_id', deprecated: true },
		{ key: 'PROJECT_ID', deprecated: true }
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

const getCredentials = async (database) => {
	try {
		if (database) {
			const creds = {
				projectId: database.project_id,
				credentials: {
					client_email: database.client_email,
					private_key: database.private_key
				}
			};
			return creds;
		} else {
			const creds = {
				projectId: getEnv(envMap, 'projectId'),
				credentials: {
					client_email: getEnv(envMap, 'credentials', 'clientEmail'),
					private_key: getEnv(envMap, 'credentials', 'privateKey')?.trim()
				}
			};
			return creds;
		}
	} catch {
		throw new Error('Missing database credentials');
	}
};

const runQuery = async (queryString, database) => {
	try {
		const credentials = await getCredentials(database);
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
