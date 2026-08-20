export type JsType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

const SNOWFLAKE_TYPE_MAP: Record<string, JsType> = {
	NUMBER: 'number',
	DECIMAL: 'number',
	NUMERIC: 'number',
	INT: 'number',
	INTEGER: 'number',
	BIGINT: 'number',
	SMALLINT: 'number',
	TINYINT: 'number',
	BYTEINT: 'number',
	FLOAT: 'number',
	FLOAT4: 'number',
	FLOAT8: 'number',
	DOUBLE: 'number',
	'DOUBLE PRECISION': 'number',
	REAL: 'number',
	FIXED: 'number',

	VARCHAR: 'string',
	CHAR: 'string',
	CHARACTER: 'string',
	STRING: 'string',
	TEXT: 'string',
	BINARY: 'string',
	VARBINARY: 'string',

	BOOLEAN: 'boolean',

	DATE: 'date',
	DATETIME: 'date',
	TIME: 'date',
	TIMESTAMP: 'date',
	TIMESTAMP_LTZ: 'date',
	TIMESTAMP_NTZ: 'date',
	TIMESTAMP_TZ: 'date',

	VARIANT: 'object',
	OBJECT: 'object',
	ARRAY: 'object',

	GEOGRAPHY: 'string',
	GEOMETRY: 'string'
};

export function getSnowflakeToJsType(snowflakeType: string): JsType {
	const normalized = snowflakeType
		.toUpperCase()
		.replace(/\(.*\)/, '')
		.trim();
	return SNOWFLAKE_TYPE_MAP[normalized] ?? 'unknown';
}
