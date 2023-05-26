const createConnection = require('snowflake-sdk');
const crypto = require('crypto');
const http = require('http');
const { readJSONSync, writeJSONSync } = require('fs-extra');

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

let snowflake_access_token;
const redirect_uri = 'http://localhost:8085';
const initiateOAuth = async (client_id, client_secret, account) => {
	const open = (await import('open')).default;
	const fetch = (await import('node-fetch')).default;

	const token_endpoint = `https://${account}.snowflakecomputing.com/oauth/token-request`;
	const authorization_endpoint = `https://${account}.snowflakecomputing.com/oauth/authorize?client_id=${encodeURIComponent(
		client_id
	)}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}`;

	const result = await new Promise((resolve, reject) => {
		const server = http
			.createServer(async function (req, res) {
				const params = new URL(req.url, redirect_uri).searchParams;

				if (params.has('error')) {
					reject(`Snowflake OAuth Error: ${params.get('error')}`);
				} else {
					const code = params.get('code');

					const response = await fetch(token_endpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
							Authorization: 'Basic ' + btoa(`${client_id}:${client_secret}`)
						},
						body: new URLSearchParams({
							grant_type: 'authorization_code',
							code,
							redirect_uri
						})
					});

					const json = await response.json();

					resolve(json);
				}

				res.end();
				server.close();
			})
			.listen(8085);

		open(authorization_endpoint);
	});

	const database = readJSONSync('./evidence.settings.json') ?? {};
	database.refresh_token = result.refresh_token;
	writeJSONSync('./evidence.settings.json', database);

	return result.access_token;
};

const refreshAccessToken = async (client_id, client_secret, account) => {
	const fetch = (await import('node-fetch')).default;
	const refresh_token = readJSONSync('./evidence.settings.json')?.refresh_token;
	if (!refresh_token) {
		snowflake_access_token = await initiateOAuth(client_id, client_secret, account);
		return snowflake_access_token;
	}

	const response = await fetch(`https://${account}.snowflakecomputing.com/oauth/token-request`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			Authorization: 'Basic ' + btoa(`${client_id}:${client_secret}`)
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token,
			redirect_uri
		})
	});

	const json = await response.json();

	return json.access_token;
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
	} else if (authenticator === 'oauth') {
		if (!snowflake_access_token) {
			snowflake_access_token = await refreshAccessToken(
				database.client_id ??
					process.env['SNOWFLAKE_CLIENT_ID'] ??
					process.env['client_id'] ??
					process.env['CLIENT_ID'],
				database.client_secret ??
					process.env['SNOWFLAKE_CLIENT_SECRET'] ??
					process.env['client_secret'] ??
					process.env['CLIENT_SECRET'],
				account
			);
			setInterval(
				async () =>
					(snowflake_access_token = await refreshAccessToken(
						database.client_id ??
							process.env['SNOWFLAKE_CLIENT_ID'] ??
							process.env['client_id'] ??
							process.env['CLIENT_ID'],
						database.client_secret ??
							process.env['SNOWFLAKE_CLIENT_SECRET'] ??
							process.env['client_secret'] ??
							process.env['CLIENT_SECRET'],
						account
					)),
				600 * 1000
			);
		}

		return {
			username,
			account,
			database: default_database,
			warehouse,
			authenticator,
			token: snowflake_access_token
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
	} else if (authenticator === 'snowflake') {
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

	throw new Error(`Invalid authenticator: ${authenticator}`);
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
