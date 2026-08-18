export type JsType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

/**
 * Databricks / Spark SQL type names → Evidence column JsType. Keys are
 * upper-cased and stripped of any `(...)` precision/length suffix before lookup
 * (see getDatabricksToJsType). The Studio client and CLI translate the driver's
 * Thrift TTypeId into these friendly names before calling in, so this stays
 * SDK-agnostic and unit-testable.
 */
const DATABRICKS_TYPE_MAP: Record<string, JsType> = {
	BOOLEAN: 'boolean',

	TINYINT: 'number',
	SMALLINT: 'number',
	INT: 'number',
	INTEGER: 'number',
	BIGINT: 'number',
	LONG: 'number',
	SHORT: 'number',
	BYTE: 'number',
	FLOAT: 'number',
	REAL: 'number',
	DOUBLE: 'number',
	DECIMAL: 'number',
	NUMERIC: 'number',

	STRING: 'string',
	VARCHAR: 'string',
	CHAR: 'string',
	BINARY: 'string',
	// Spark's INTERVAL renders as a string label; treat as text.
	INTERVAL: 'string',

	DATE: 'date',
	TIMESTAMP: 'date',
	TIMESTAMP_NTZ: 'date',
	TIMESTAMP_LTZ: 'date',

	// Complex types deserialize to JS objects/arrays.
	ARRAY: 'object',
	MAP: 'object',
	STRUCT: 'object',
	VARIANT: 'object'
};

export function getDatabricksToJsType(databricksType: string): JsType {
	const normalized = databricksType
		.toUpperCase()
		.replace(/\(.*\)/, '')
		.replace(/<.*>/, '')
		.trim();
	return DATABRICKS_TYPE_MAP[normalized] ?? 'unknown';
}
