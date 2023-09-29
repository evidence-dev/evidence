const { getEnv } = require('@evidence-dev/db-commons');
const { DBSQLClient, thrift } = require('@databricks/sql');
const TTypeId = thrift.TCLIService_types.TTypeId;

const envMap = {
	host: [
		{ key: 'EVIDENCE_DATABRICKS_HOST', deprecated: false },
		{ key: 'DATABRICKS_HOST', deprecated: false },
		{ key: 'host', deprecated: true },
		{ key: 'HOST', deprecated: true }
	],
	port: [
		{ key: 'EVIDENCE_DATABRICKS_PORT', deprecated: false },
		{ key: 'DATABRICKS_PORT', deprecated: false },
		{ key: 'port', deprecated: true },
		{ key: 'PORT', deprecated: true }
	],
	path: [
		{ key: 'EVIDENCE_DATABRICKS_PATH', deprecated: false },
		{ key: 'DATABRICKS_PATH', deprecated: false },
		{ key: 'path', deprecated: true },
		{ key: 'PATH', deprecated: true }
	],
	clientId: [
		{ key: 'EVIDENCE_DATABRICKS_CLIENT_ID', deprecated: false },
		{ key: 'DATABRICKS_CLIENT_ID', deprecated: false },
		{ key: 'clientID', deprecated: true },
		{ key: 'CLIENT_ID', deprecated: true }
	],
	token: [
		{ key: 'EVIDENCE_DATABRICKS_TOKEN', deprecated: false },
		{ key: 'DATABRICKS_TOKEN', deprecated: false },
		{ key: 'token', deprecated: true },
		{ key: 'TOKEN', deprecated: true }
	]
};

function nativeTypeToEvidenceType(data) {
	switch (data) {
		case TTypeId.BOOLEAN_TYPE:
			return 'boolean';
		case TTypeId.DATE_TYPE:
		case TTypeId.TIMESTAMP_TYPE:
			return 'date';
		case TTypeId.STRUCT_TYPE:
		case TTypeId.MAP_TYPE:
		case TTypeId.ARRAY_TYPE:
			return 'string';
		case TTypeId.DECIMAL_TYPE:
		case TTypeId.BIGINT_TYPE:
		case TTypeId.FLOAT_TYPE:
		case TTypeId.DOUBLE_TYPE:
		case TTypeId.INT_TYPE:
		case TTypeId.SMALLINT_TYPE:
		case TTypeId.TINYINT_TYPE:
			return 'number';
		case TTypeId.UNION_TYPE:
		case TTypeId.USER_DEFINED_TYPE:
		case TTypeId.NULL_TYPE:
		case TTypeId.INTERVAL_YEAR_MONTH_TYPE:
		case TTypeId.INTERVAL_DAY_TIME_TYPE:
		case TTypeId.STRING_TYPE:
		case TTypeId.CHAR_TYPE:
		case TTypeId.VARCHAR_TYPE:
		case TTypeId.BINARY_TYPE:
		default:
			return 'string';
	}
}

/**
 * @template {Function} T
 * @typedef {Awaited<ReturnType<T>>} Returned
 */

/**
 * 
 * @param {Returned<Returned<import("@databricks/sql").DBSQLSession["executeStatement"]>["getSchema"]>} schema 
 * @returns {{ name: string; evidenceType: string; typeFidelity: string; }[]}
 */
const mapResultsToEvidenceColumnTypes = function (schema) {
	return schema?.columns.map((column) => {
		let typeFidelity = 'precise';
		let evidenceType = nativeTypeToEvidenceType(column.typeDesc.types[0]?.primitiveEntry?.type);
		if (!evidenceType) {
			typeFidelity = 'inferred';
			evidenceType = 'string';
		}
		return { name: column.columnName, evidenceType, typeFidelity };
	});
};

const runQuery = async (queryString, database) => {
	const credentials = {
		authType: "access-token",
		host: getEnv(envMap, 'host') ?? database.host,
		port: getEnv(envMap, 'port') ?? database.port,
		path: getEnv(envMap, 'path') ?? database.path,
		clientId: getEnv(envMap, 'clientId') ?? database.clientId,
		token: getEnv(envMap, 'token') ?? database.token
	};

	try {
		const client = new DBSQLClient();
		const connection = await client.connect(credentials);
		const session = await connection.openSession();

		const query = await session.executeStatement(queryString);

		const rows = await query.fetchAll();
		const schema = await query.getSchema();

		await query.close();
		await session.close();
		await connection.close();
		await client.close();

		return { rows, columnTypes: mapResultsToEvidenceColumnTypes(schema) };
	} catch (err) {
		if (err.message) {
			throw err.message;
		} else {
			throw err;
		}
	}
};

module.exports = runQuery;
