const createConnection = require('snowflake-sdk');
const crypto = require('crypto');

const execute = async (connection, queryString, useAsync = false) => {
	const connectMethod = useAsync ? 'connectAsync' : 'connect';
	await connection[connectMethod](function (err) {
		if (err) {
			throw 'Unable to connect: ' + err.message;
		}
	});
	return new Promise((resolve, reject) => {
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
	const authenticator =
		database.authenticator ??
		process.env['SNOWFLAKE_AUTHENTICATOR'] ??
		process.env['authenticator'] ??
		process.env['AUTHENTICATOR'];
	const account =
		database.account ??
		process.env['SNOWFLAKE_ACCOUNT'] ??
		process.env['account'] ??
		process.env['ACCOUNT'];
	const username =
		database.username ??
		process.env['SNOWFLAKE_USERNAME'] ??
		process.env['username'] ??
		process.env['USERNAME'];
	const default_database =
		database.database ??
		process.env['SNOWFLAKE_DATABASE'] ??
		process.env['database'] ??
		process.env['DATABASE'];
	const warehouse =
		database.warehouse ??
		process.env['SNOWFLAKE_WAREHOUSE'] ??
		process.env['warehouse'] ??
		process.env['WAREHOUSE'];

	if (authenticator === 'snowflake_jwt') {
		const private_key =
			database.private_key ??
			process.env['SNOWFLAKE_PRIVATE_KEY'] ??
			process.env['private_key'] ??
			process.env['PRIVATE_KEY'];
		const passphrase =
			database.passphrase ??
			process.env['SNOWFLAKE_PASSPHRASE'] ??
			process.env['passphrase'] ??
			process.env['PASSPHRASE'];

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
			password:
				database.password ??
				process.env['SNOWFLAKE_PASSWORD'] ??
				process.env['password'] ??
				process.env['PASSWORD'],
			account,
			database: default_database,
			warehouse,
			authenticator:
				database.okta_url ??
				process.env['SNOWFLAKE_OKTA_URL'] ??
				process.env['okta_url'] ??
				process.env['OKTA_URL']
		};
	} else {
		return {
			username,
			password:
				database.password ??
				process.env['SNOWFLAKE_PASSWORD'] ??
				process.env['password'] ??
				process.env['PASSWORD'],
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
