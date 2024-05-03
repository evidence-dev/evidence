/**
 * @param {number} length
 * @param {import('../index.js').DescribeResultRow[]} columns
 * @returns {number}
 */
export const getQueryScore = (length, columns) => {
	const scorePerRow = columns.reduce(
		(a, v) => a + columnTypeToScore(v.column_type),
		columns.length * 4 // include overhead for each column
	);
	return Math.abs(scorePerRow * length);
};

// Util Functions

/**
 * @param {string} columnType
 * @returns {columnType is `STRUCT(${string})` | `${string}[]`}
 */
function isObjectType(columnType) {
	return columnType.startsWith('STRUCT') || columnType.endsWith('[]');
}

/**
 * @param {string} columnType
 * @returns {columnType is `DECIMAL(${number},${number})`}
 */
function isDecimalType(columnType) {
	return columnType.startsWith('DECIMAL');
}

/**
 *
 * @param {import('../../types/duckdb-wellknown.js').DuckDBColumnType} columnType
 * @returns {number}
 */
function columnTypeToScore(columnType) {
	const roundedColumnScores = {
		string: 2 * 15,
		number: 12,
		boolean: 4,
		date: 48
	};

	if (isObjectType(columnType)) {
		console.warn(
			'[!] Evidence does not support DuckDB Struct or Array\nIf you need to use one, convert it to JSON in your query, and then manually parse it in your project'
		);
		return roundedColumnScores.string;
	}
	if (isDecimalType(columnType)) return roundedColumnScores.number;

	switch (columnType) {
		case 'BOOLEAN':
			return roundedColumnScores.boolean;
		case 'BIGINT':
		case 'DOUBLE':
		case 'FLOAT':
		case 'INTEGER':
		case 'SMALLINT':
		case 'TINYINT':
		case 'UBIGINT':
		case 'UINTEGER':
		case 'USMALLINT':
		case 'UTINYINT':
		case 'HUGEINT':
			return roundedColumnScores.number;
		case 'UUID':
		case 'VARCHAR':
			return roundedColumnScores.string;
		case 'DATE':
		case 'TIMESTAMP':
		case 'TIMESTAMP_S':
		case 'TIMESTAMP_MS':
		case 'TIMESTAMP_NS':
		case 'TIMESTAMP WITH TIME ZONE':
			return roundedColumnScores.date;

		// the badlands
		// we should probably convert these in the client library too
		case 'INTERVAL': // return 'Uint32Array';
		case 'TIME':
		case 'TIME WITH TIME ZONE': // return 'bigint';
		case 'BLOB':
		case 'BIT': // return 'Uint8Array';
			return roundedColumnScores.string;
		default:
			// columnType should be `never`
			console.error(`Column type ${columnType} is not supported`);
			return roundedColumnScores.string;
	}
}
