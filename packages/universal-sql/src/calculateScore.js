/* // generate with DESCRIBE SELECT column_type FROM test_all_types();
type DuckDBColumnType =
	| `STRUCT(${string})`
	| `${string}[]`
	| 'BIGINT'
	| 'BIT'
	| 'BOOLEAN'
	| 'BLOB'
	| 'DATE'
	| 'DOUBLE'
	| `DECIMAL(${number},${number})`
	| 'HUGEINT'
	| 'INTEGER'
	| 'INTERVAL'
	| 'FLOAT'
	| 'SMALLINT'
	| 'TIME'
	| 'TIMESTAMP'
	| 'TIMESTAMP_S'
	| 'TIMESTAMP_MS'
	| 'TIMESTAMP_NS'
	| 'TIME WITH TIME ZONE'
	| 'TIMESTAMP WITH TIME ZONE'
	| 'TINYINT'
	| 'UBIGINT'
	| 'UINTEGER'
	| 'USMALLINT'
	| 'UTINYINT'
	| 'UUID'
	| 'VARCHAR';
*/

/**
 * @param {string} column_type
 * @returns {column_type is `STRUCT(${string})` | `${string}[]`}
 */
function isObjectType(column_type) {
	return column_type.startsWith('STRUCT') || column_type.endsWith('[]');
}

/**
 * @param {string} column_type
 * @returns {column_type is `DECIMAL(${number},${number})`}
 */
function isDecimalType(column_type) {
	return column_type.startsWith('DECIMAL');
}

/**
 *
 * @param {string} column_type
 * @returns {number}
 */
function columnTypeToScore(column_type) {
	const NUMBER = 12; // 8 bytes in a double + 4 bytes heap overhead?
	const BOOLEAN = 4; // booleans are stored as 4 byte integers
	const STRING = 2 * 15; // assume 15 character string
	const DATE = 48; // dates use 48 bytes
	const UNKNOWN = 0;

	// objects aren't handled well
	if (isObjectType(column_type)) return UNKNOWN;
	if (isDecimalType(column_type)) return NUMBER;

	switch (column_type) {
		case 'BOOLEAN':
			return BOOLEAN;
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
			return NUMBER;
		case 'UUID':
		case 'VARCHAR':
			return STRING;
		case 'DATE':
		case 'TIMESTAMP':
		case 'TIMESTAMP_S':
		case 'TIMESTAMP_MS':
		case 'TIMESTAMP_NS':
		case 'TIMESTAMP WITH TIME ZONE':
			return DATE;

		// the badlands
		// we should probably convert these in the client library too
		case 'INTERVAL': // return 'Uint32Array';
		case 'TIME':
		case 'TIME WITH TIME ZONE': // return 'bigint';
		case 'BLOB':
		case 'BIT': // return 'Uint8Array';
			return UNKNOWN;
		default:
			// column_type should be `never`
			console.error(`Column type ${column_type} is not supported`);
			return UNKNOWN;
	}
}

/**
 * @param {{ name: string; type: string }[]} columns
 * @returns {number}
 */
export function columnsToScore(columns) {
	let score = columns.length * 4; // some overhead for each column

	for (const { type } of columns) {
		score += columnTypeToScore(type);
	}

	return score;
}
