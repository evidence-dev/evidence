export type JsType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

/**
 * DuckDB / MotherDuck type names → Evidence column JsType.
 *
 * Keys are upper-cased and stripped of any `(...)` precision/length suffix and
 * any trailing `[]` array marker before lookup (see getMotherduckToJsType), so
 * `DECIMAL(18,2)` and `INTEGER[]` both resolve.
 */
const MOTHERDUCK_TYPE_MAP: Record<string, JsType> = {
	BOOLEAN: 'boolean',
	BOOL: 'boolean',
	LOGICAL: 'boolean',

	TINYINT: 'number',
	SMALLINT: 'number',
	INTEGER: 'number',
	INT: 'number',
	INT1: 'number',
	INT2: 'number',
	INT4: 'number',
	INT8: 'number',
	BIGINT: 'number',
	HUGEINT: 'number',
	UTINYINT: 'number',
	USMALLINT: 'number',
	UINTEGER: 'number',
	UBIGINT: 'number',
	UHUGEINT: 'number',
	DECIMAL: 'number',
	NUMERIC: 'number',
	REAL: 'number',
	FLOAT: 'number',
	FLOAT4: 'number',
	FLOAT8: 'number',
	DOUBLE: 'number',

	VARCHAR: 'string',
	CHAR: 'string',
	BPCHAR: 'string',
	TEXT: 'string',
	STRING: 'string',
	UUID: 'string',
	BLOB: 'string',
	BYTEA: 'string',
	BIT: 'string',
	ENUM: 'string',
	INTERVAL: 'string',
	JSON: 'string',

	DATE: 'date',
	TIMESTAMP: 'date',
	DATETIME: 'date',
	TIMESTAMP_S: 'date',
	TIMESTAMP_MS: 'date',
	TIMESTAMP_NS: 'date',
	TIMESTAMPTZ: 'date',
	'TIMESTAMP WITH TIME ZONE': 'date',
	TIME: 'date',
	TIMETZ: 'date',
	'TIME WITH TIME ZONE': 'date',

	STRUCT: 'object',
	MAP: 'object',
	LIST: 'object',
	ARRAY: 'object',
	UNION: 'object'
};

export function getMotherduckToJsType(duckdbType: string): JsType {
	let normalized = duckdbType.toUpperCase().trim();
	// `INTEGER[]` / `VARCHAR[]` etc. — an array of a base type is an object column.
	if (normalized.endsWith('[]')) return 'object';
	// `STRUCT(...)`, `MAP(...)`, `LIST(...)`, `DECIMAL(18,2)` → strip the args, then
	// match on the bare type name.
	normalized = normalized.replace(/\(.*\)/, '').trim();
	return MOTHERDUCK_TYPE_MAP[normalized] ?? 'unknown';
}
