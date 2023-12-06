const trino = require('presto-client');
const { getEnv, EvidenceType, TypeFidelity } = require('@evidence-dev/db-commons');

const envMap = {
	host: [
		{ key: 'EVIDENCE_TRINO_HOST', deprecated: false },
		{ key: 'TRINO_HOST', deprecated: false }
	],
	ssl: [
		{ key: 'EVIDENCE_TRINO_SSL', deprecated: false },
		{ key: 'TRINO_SSL', deprecated: false }
	],
	port: [
		{ key: 'EVIDENCE_TRINO_PORT', deprecated: false },
		{ key: 'TRINO_PORT', deprecated: false }
	],
	user: [
		{ key: 'EVIDENCE_TRINO_USER', deprecated: false },
		{ key: 'TRINO_USER', deprecated: false }
	],
	password: [
		{ key: 'EVIDENCE_TRINO_PASSWORD', deprecated: false },
		{ key: 'TRINO_PASSWORD', deprecated: false }
	],
	catalog: [
		{ key: 'EVIDENCE_TRINO_CATALOG', deprecated: false },
		{ key: 'TRINO_CATALOG', deprecated: true }
	],
	schema: [
		{ key: 'EVIDENCE_TRINO_SCHEMA', deprecated: false },
		{ key: 'TRINO_SCHEMA', deprecated: true }
	],
	engine: [
		{ key: 'EVIDENCE_TRINO_ENGINE', deprecated: false },
		{ key: 'TRINO_ENGINE', deprecated: true }
	]
};

const runQuery = async (queryString, database) => {
	try {
		const ssl = database ? database.ssl : getEnv(envMap, 'ssl');

		const engine = database ? database.engine : getEnv(envMap, 'engine');

		const client = new trino.Client({
			host: database ? database.host : getEnv(envMap, 'host'),
			ssl: ssl === 'true' ? {} : undefined,
			port: database ? database.port : getEnv(envMap, 'port'),
			user: database ? database.user : getEnv(envMap, 'user'),
			source: 'evidence',
			basic_auth: database
				? auth(database.user, database.password)
				: auth(getEnv(envMap, 'user'), getEnv(envMap, 'password')),
			catalog: database ? database.catalog : getEnv(envMap, 'catalog'),
			schema: database ? database.schema : getEnv(envMap, 'schema'),
			engine: engine ? engine : 'trino'
		});

		const result = await new Promise((resolve, reject) => {
			let rows = [];
			let columnTypes = [];
			client.execute({
				query: queryString,
				columns: function (_error, newColumnTypes) {
					columnTypes = columnTypes.concat(newColumnTypes);
				},
				data: function (_error, newRows) {
					rows = rows.concat(newRows);
				},
				callback: function (error) {
					error === null ? resolve({ rows, columnTypes }) : reject({ error });
				}
			});
		});

		const adjustedResult = adjustResult(result);

		return adjustedResult;
	} catch (err) {
		if (err.error?.message) {
			throw err.error.message.replace(/\n|\r/g, ' ');
		} else {
			throw err;
		}
	}
};

const auth = (user, password) => {
	return user !== null && password !== null ? { user, password } : null;
};

const adjustResult = (result) => {
	const columnTypes = result.columnTypes.map((c) => {
		return {
			name: normalizeColumnName(c.name),
			evidenceType: mapTrinoTypeToEvidenceType(c.type),
			typeFidelity: TypeFidelity.PRECISE
		};
	});
	const rows = result.rows.map((row) => {
		const rowObj = {};
		row.forEach((v, i) => {
			let vAdjusted = typeof v === 'object' && v !== null ? v.toString() : v;
			rowObj[columnTypes[i].name] = vAdjusted;
		});
		return rowObj;
	});
	return { rows, columnTypes };
};

const normalizeColumnName = (name) => {
	return name.toLowerCase().replaceAll(' ', '_');
};

const mapTrinoTypeToEvidenceType = (type) => {
	const typeLower = type.toLowerCase();
	// Trino's types as reported by the API can be found here:
	// https://github.com/trinodb/trino/blob/master/client/trino-client/src/main/java/io/trino/client/ClientStandardTypes.java
	switch (typeLower) {
		case 'boolean':
			return EvidenceType.BOOLEAN;
		case 'tinyint':
		case 'smallint':
		case 'integer':
		case 'bigint':
		case 'real':
		case 'double':
			return EvidenceType.NUMBER;
		case typeLower.match(/^decimal/)?.input: // TODO: treat decimal as a number too?
		case 'varchar':
		case typeLower.match(/^char/)?.input:
		case 'varbinary':
		case 'json':
			return EvidenceType.STRING;
		case 'date':
		case 'time':
		case 'time with time zone':
		case 'timestamp':
		case 'timestamp with time zone':
			return EvidenceType.DATE;
		case 'interval year to month':
		case 'interval day to second':
		case typeLower.match(/^array/)?.input:
		case typeLower.match(/^map/)?.input:
		case typeLower.match(/^row/)?.input:
		case 'ipaddress':
		case 'uuid':
		case 'hyperloglog':
		case 'p4hyperloglog':
		case typeLower.match(/^qdigest/)?.input:
		case 'geometry':
		case 'sphericalgeography':
			return EvidenceType.STRING;
		default:
			return undefined;
	}
};

module.exports = runQuery;

/*
Opts from deleted form:
	let opts = [
		{
			id: 'host',
			label: 'Host',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'database.server.com',
			value: credentials.host ?? ''
		},
		{
			id: 'ssl',
			label: 'SSL',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'true',
			value: credentials.ssl ?? '',
			additionalInstructions: `Options are 'true' and 'false'. Must be set to 'true' for HTTPS`
		},
		{
			id: 'port',
			label: 'Port',
			type: 'text',
			optional: false,
			override: false,
			placeholder: '443',
			value: credentials.port ?? ''
		},
		{
			id: 'user',
			label: 'User',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'evidence',
			value: credentials.user ?? ''
		},
		{
			id: 'password',
			label: 'Password',
			type: 'password',
			optional: true,
			override: false,
			placeholder: 'password',
			value: credentials.password ?? ''
		},
		{
			id: 'catalog',
			label: 'Catalog',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'system',
			value: credentials.catalog ?? '',
			additionalInstructions: 'The default catalog to run queries against.'
		},
		{
			id: 'schema',
			label: 'Schema',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'metadata',
			value: credentials.schema ?? '',
			additionalInstructions: 'The default schema to run queries against.'
		},
		{
			id: 'engine',
			label: 'Engine',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'trino',
			value: credentials.engine ?? '',
			additionalInstructions: `The engine to use. Options are 'trino' and 'presto'. Default is 'trino'.`
		}
	];


*/