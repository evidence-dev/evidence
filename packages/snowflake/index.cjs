const { getEnv } = require('@evidence-dev/db-commons');
const createConnection = require('snowflake-sdk');
const crypto = require('crypto');

const envMap = {
	authenticator: [
		{ key: 'EVIDENCE_SNOWFLAKE_AUTHENTICATOR', deprecated: false },
		{ key: 'SNOWFLAKE_AUTHENTICATOR', deprecated: false }
	],
	account: [
		{ key: 'EVIDENCE_SNOWFLAKE_ACCOUNT', deprecated: false },
		{ key: 'SNOWFLAKE_ACCOUNT', deprecated: false },
		{ key: 'ACCOUNT', deprecated: true },
		{ key: 'account', deprecated: true }
	],
	username: [
		{ key: 'EVIDENCE_SNOWFLAKE_USERNAME', deprecated: false },
		{ key: 'SNOWFLAKE_USERNAME', deprecated: false },
		{ key: 'USERNAME', deprecated: true },
		{ key: 'username', deprecated: true }
	],
	password: [
		{ key: 'EVIDENCE_SNOWFLAKE_PASSWORD', deprecated: false },
		{ key: 'SNOWFLAKE_PASSWORD', deprecated: false },
		{ key: 'PASSWORD', deprecated: true },
		{ key: 'password', deprecated: true }
	],
	database: [
		{ key: 'EVIDENCE_SNOWFLAKE_DATABASE', deprecated: false },
		{ key: 'SNOWFLAKE_DATABASE', deprecated: false },
		{ key: 'DATABASE', deprecated: true },
		{ key: 'database', deprecated: true }
	],
	warehouse: [
		{ key: 'EVIDENCE_SNOWFLAKE_WAREHOUSE', deprecated: false },
		{ key: 'SNOWFLAKE_WAREHOUSE', deprecated: false },
		{ key: 'WAREHOUSE', deprecated: true },
		{ key: 'warehouse', deprecated: true }
	],
	privateKey: [
		{ key: 'EVIDENCE_SNOWFLAKE_PRIVATE_KEY', deprecated: false },
		{ key: 'SNOWFLAKE_PRIVATE_KEY', deprecated: false }
	],
	passphrase: [
		{ key: 'EVIDENCE_SNOWFLAKE_PASSPHRASE', deprecated: false },
		{ key: 'SNOWFLAKE_PASSPHRASE', deprecated: false }
	],
	okta_url: [
		{ key: 'EVIDENCE_SNOWFLAKE_OKTA_URL', deprecated: false },
		{ key: 'SNOWFLAKE_OKTA_URL', deprecated: false }
	]
};

const execute = async (connection, queryString, useAsync = false) => {
	return new Promise((resolve, reject) => {
		function finishExecution() {
			connection.execute({
				sqlText: queryString,
				complete: function (err, stmt, rows) {
					if (err) {
						reject(err);
					} else {
						let columns;
						if (stmt) {
							columns = stmt.getColumns()?.map((next) => {
								return { name: next.getName(), type: next.getType() };
							});
						}
						resolve({ rows, columns });
					}
				}
			});
		}

		if (useAsync) {
			connection
				.connectAsync((err) => {
					if (err) {
						reject(err);
					}
				})
				.then(finishExecution);
		} else {
			connection.connect((err) => {
				if (err) {
					reject(err);
				}
			});
			finishExecution();
		}
	});
};

const nativeTypeToEvidenceType = function (dataBaseType, defaultResultEvidenceType = undefined) {
	if (dataBaseType) {
		let standardizedDBType = dataBaseType.toUpperCase();
		if (standardizedDBType.indexOf('(') >= 0) {
			//handles NUMBER(precision, scale) etc
			standardizedDBType = standardizedDBType.substring(0, standardizedDBType.indexOf('(')).trim();
		}
		switch (standardizedDBType) {
			case 'BOOLEAN':
				return 'boolean';
			case 'INT':
			case 'INTEGER':
			case 'BIGINT':
			case 'SMALLINT':
			case 'NUMBER':
			case 'DECIMAL':
			case 'NUMERIC':
			case 'FLOAT':
			case 'FLOAT4':
			case 'FLOAT8':
			case 'DOUBLE':
			case 'DOUBLE PRECISION':
			case 'REAL':
			case 'FIXED':
				return 'number';
			case 'VARCHAR':
			case 'CHAR':
			case 'CHARACTER':
			case 'STRING':
			case 'TEXT':
			case 'TIME':
				return 'string';
			case 'TIMESTAMP':
			case 'TIMESTAMP_LTZ':
			case 'TIMESTAMP_NTZ':
			case 'TIMESTAMP_TZ':
			case 'DATE':
				return 'date';
			case 'VARIANT':
			case 'ARRAY':
			case 'OBJECT':
				return defaultResultEvidenceType;
		}
	}
	return defaultResultEvidenceType;
};

const mapResultsToEvidenceColumnTypes = function (results) {
	return results?.columns?.map((field) => {
		let typeFidelity = 'precise';
		let evidenceType = nativeTypeToEvidenceType(field.type);
		if (!evidenceType) {
			typeFidelity = 'inferred';
			evidenceType = 'string';
		}
		return {
			name: field.name.toLowerCase(), // opening an issue for this -- not sure if we should just respect snowflake capitalizing all column names, or not. makes for unpleasant syntax elsewhere
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

const standardizeResult = async (result) => {
	var output = [];
	result.forEach((row) => {
		const lowerCasedRow = {};
		for (const [key, value] of Object.entries(row)) {
			lowerCasedRow[key.toLowerCase()] = value;
		}
		output.push(lowerCasedRow);
	});
	return output;
};

const getCredentials = async (database = {}) => {
	const authenticator = database.authenticator ?? getEnv(envMap, 'authenticator') ?? 'snowflake';
	const account = database.account ?? getEnv(envMap, 'account');
	const username = database.username ?? getEnv(envMap, 'username');
	const default_database = database.database ?? getEnv(envMap, 'database');
	const warehouse = database.warehouse ?? getEnv(envMap, 'warehouse');

	if (authenticator === 'snowflake_jwt') {
		const private_key = database.private_key ?? getEnv(envMap, 'privateKey');
		const passphrase = database.passphrase ?? getEnv(envMap, 'passphrase');

		const private_key_object = crypto.createPrivateKey({
			key: private_key,
			format: 'pem',
			passphrase
		});
		const decrypted_private_key = private_key_object.export({
			type: 'pkcs8',
			format: 'pem'
		});

		return {
			privateKey: decrypted_private_key,
			username,
			account,
			database: default_database,
			warehouse,
			authenticator
		};
	} else if (authenticator === 'externalbrowser') {
		return {
			username,
			account,
			database: default_database,
			warehouse,
			authenticator
		};
	} else if (authenticator === 'okta') {
		return {
			username,
			password: database.password ?? getEnv(envMap, 'password'),
			account,
			database: default_database,
			warehouse,
			authenticator: database.okta_url ?? getEnv(envMap, 'okta_url')
		};
	} else {
		return {
			username,
			password: database.password ?? getEnv(envMap, 'password'),
			account,
			database: default_database,
			warehouse
		};
	}
};

const runQuery = async (queryString, database) => {
	try {
		const credentials = await getCredentials(database);

		const connection = createConnection.createConnection(credentials);

		const result = await execute(
			connection,
			queryString,
			credentials.authenticator?.startsWith('https://') ||
				credentials.authenticator === 'externalbrowser'
		);

		const standardizedResults = await standardizeResult(result.rows);
		return { rows: standardizedResults, columnTypes: mapResultsToEvidenceColumnTypes(result) };
	} catch (err) {
		if (err.message) {
			throw err.message.replace(/\n|\r/g, ' ');
		} else {
			throw err.replace(/\n|\r/g, ' ');
		}
	}
};

module.exports = runQuery;
