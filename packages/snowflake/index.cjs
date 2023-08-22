const { getEnv, EvidenceType, TypeFidelity } = require('@evidence-dev/db-commons');
const snowflake = require('snowflake-sdk');
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
	role: [
		{ key: 'EVIDENCE_SNOWFLAKE_ROLE', deprecated: false },
		{ key: 'SNOWFLAKE_ROLE', deprecated: false }
	],
	schema: [
		{ key: 'EVIDENCE_SNOWFLAKE_SCHEMA', deprecated: false },
		{ key: 'SNOWFLAKE_SCHEMA', deprecated: false }
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

/**
 *
 * @param {Record<string, unknown>[]} results
 * @param {import('@evidence-dev/db-commons').ColumnDefinition[]} columns
 * @returns {Record<string, unknown>[]}
 */
function stringifyNonstringColumns(results, columns) {
	// fast paths if processing isn't necessary
	if (columns.every(({ evidenceType }) => evidenceType !== EvidenceType.STRING)) return results;
	if (
		results.length > 0 &&
		columns
			.filter(({ evidenceType }) => evidenceType !== EvidenceType.STRING)
			.every(({ name }) => typeof results[0][name] === 'string')
	)
		return results;

	for (const row of results) {
		for (const { name } of columns.filter(
			({ evidenceType }) => evidenceType === EvidenceType.STRING
		)) {
			if (row[name] instanceof Buffer) {
				row[name] = row[name].toString();
			} else if (typeof row[name] === 'object') {
				row[name] = JSON.stringify(row[name]);
			} else if (typeof row[name] !== 'string') {
				row[name] = String(row[name]);
			}
		}
	}
	return results;
}

/**
 *
 * @param {snowflake.Connection} connection
 * @param {string} queryString
 * @param {boolean} useAsync
 * @returns {Promise<{ rows?: Record<string, unknown>[], columns?: { name: string, type: string }[] }>}
 */
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

/**
 *
 * @param {string} dataBaseType
 * @param {undefined} defaultResultEvidenceType
 * @returns {EvidenceType | undefined}
 */
const nativeTypeToEvidenceType = function (dataBaseType, defaultResultEvidenceType = undefined) {
	if (dataBaseType) {
		let standardizedDBType = dataBaseType.toUpperCase();
		if (standardizedDBType.indexOf('(') >= 0) {
			//handles NUMBER(precision, scale) etc
			standardizedDBType = standardizedDBType.substring(0, standardizedDBType.indexOf('(')).trim();
		}
		switch (standardizedDBType) {
			case 'BOOLEAN':
				return EvidenceType.BOOLEAN;
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
				return EvidenceType.NUMBER;
			case 'VARCHAR':
			case 'CHAR':
			case 'CHARACTER':
			case 'STRING':
			case 'TEXT':
			case 'TIME':
				return EvidenceType.STRING;
			case 'TIMESTAMP':
			case 'TIMESTAMP_LTZ':
			case 'TIMESTAMP_NTZ':
			case 'TIMESTAMP_TZ':
			case 'DATE':
				return EvidenceType.DATE;
			case 'VARIANT':
			case 'ARRAY':
			case 'OBJECT':
				return defaultResultEvidenceType;
		}
	}
	return defaultResultEvidenceType;
};

/**
 *
 * @param {Awaited<ReturnType<typeof execute>>} results
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition[] | undefined}
 */
const mapResultsToEvidenceColumnTypes = function (results) {
	return results?.columns?.map((field) => {
		/** @type {TypeFidelity} */
		let typeFidelity = TypeFidelity.PRECISE;
		let evidenceType = nativeTypeToEvidenceType(field.type);
		if (!evidenceType) {
			typeFidelity = TypeFidelity.INFERRED;
			evidenceType = EvidenceType.STRING;
		}
		return {
			name: field.name.toLowerCase(), // opening an issue for this -- not sure if we should just respect snowflake capitalizing all column names, or not. makes for unpleasant syntax elsewhere
			evidenceType: evidenceType,
			typeFidelity: typeFidelity
		};
	});
};

/**
 *
 * @param {Record<string, unknown>[] | undefined} result
 * @returns {Record<string, unknown>[]}
 */
const standardizeResult = (result) => {
	/** @type {Record<string, unknown>[]} */
	const output = [];
	result?.forEach((row) => {
		/** @type {Record<string, unknown>} */
		const lowerCasedRow = {};
		for (const [key, value] of Object.entries(row)) {
			lowerCasedRow[key.toLowerCase()] = value;
		}
		output.push(lowerCasedRow);
	});
	return output;
};

/**
 * @param {Partial<SnowflakeOptions>} database
 * @returns {snowflake.ConnectionOptions}
 */
const getCredentials = (database = {}) => {
	const authenticator = database.authenticator ?? getEnv(envMap, 'authenticator') ?? 'snowflake';
	const account = database.account ?? getEnv(envMap, 'account');
	const username = database.username ?? getEnv(envMap, 'username');
	const default_database = database.database ?? getEnv(envMap, 'database');
	const warehouse = database.warehouse ?? getEnv(envMap, 'warehouse');
	const role = database.role ?? getEnv(envMap, 'role');
	const schema = database.schema ?? getEnv(envMap, 'schema');

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
			role,
			schema,
			authenticator
		};
	} else if (authenticator === 'externalbrowser') {
		return {
			username,
			account,
			database: default_database,
			warehouse,
			role,
			schema,
			authenticator
		};
	} else if (authenticator === 'okta') {
		return {
			username,
			password: database.password ?? getEnv(envMap, 'password'),
			account,
			database: default_database,
			warehouse,
			role,
			schema,
			authenticator: database.okta_url ?? getEnv(envMap, 'okta_url')
		};
	} else {
		return {
			username,
			password: database.password ?? getEnv(envMap, 'password'),
			account,
			database: default_database,
			warehouse,
			schema,
			role
		};
	}
};

/** @type {import('@evidence-dev/db-commons').RunQuery<SnowflakeOptions>} */
const runQuery = async (queryString, database) => {
	try {
		const credentials = getCredentials(database);

		const connection = snowflake.createConnection(credentials);

		const result = await execute(
			connection,
			queryString,
			credentials.authenticator?.startsWith('https://') ||
				credentials.authenticator === 'externalbrowser'
		);

		const standardizedResults = standardizeResult(result.rows);
		const columnTypes = mapResultsToEvidenceColumnTypes(result);
		return { rows: stringifyNonstringColumns(standardizedResults, columnTypes), columnTypes };
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
 * @typedef {Object} SnowflakeBaseOptions
 * @property {string} account
 * @property {string} username
 * @property {string} database
 * @property {string} warehouse
 * @property {string} role
 * @property {string} schema
 */

/**
 * @typedef {Object} SnowflakeJwtOptions
 * @property {'snowflake_jwt'} authenticator
 * @property {string} private_key
 * @property {string} passphrase
 */

/**
 * @typedef {Object} SnowflakeBrowserOptions
 * @property {'externalbrowser'} authenticator
 */

/**
 * @typedef {Object} SnowflakeOktaOptions
 * @property {'okta'} authenticator
 * @property {string} password
 * @property {string} okta_url
 */

/**
 * @typedef {SnowflakeBaseOptions & (SnowflakeJwtOptions | SnowflakeBrowserOptions | SnowflakeOktaOptions)} SnowflakeOptions
 */

/** @type {import('@evidence-dev/db-commons').GetRunner<SnowflakeOptions>} */
module.exports.getRunner = async (opts) => {
	return async (queryContent, queryPath) => {
		// Filter out non-sql files
		if (!queryPath.endsWith('.sql')) return null;
		return runQuery(queryContent, opts);
	};
};
