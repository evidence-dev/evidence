export type JsType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

const BIGQUERY_TYPE_MAP: Record<string, JsType> = {
	STRING: 'string',
	BYTES: 'string',
	GEOGRAPHY: 'string',
	INTERVAL: 'string',

	INT64: 'number',
	INTEGER: 'number',
	INT: 'number',
	SMALLINT: 'number',
	TINYINT: 'number',
	BIGINT: 'number',
	FLOAT64: 'number',
	FLOAT: 'number',
	NUMERIC: 'number',
	DECIMAL: 'number',
	BIGNUMERIC: 'number',
	BIGDECIMAL: 'number',

	BOOL: 'boolean',
	BOOLEAN: 'boolean',

	DATE: 'date',
	DATETIME: 'date',
	TIME: 'date',
	TIMESTAMP: 'date',

	JSON: 'object',
	STRUCT: 'object',
	RECORD: 'object',
	ARRAY: 'object'
};

/**
 * Map a BigQuery column type string to a Js category.
 * Strips parameters (e.g. NUMERIC(38,9)) and ARRAY<inner> wrappers so the
 * inner element drives the category. STRUCT/RECORD stay 'object' even when
 * fully spelled out (e.g. STRUCT<a INT64, b STRING>) — callers that need to
 * know about REPEATED mode should consult the column metadata's `mode` field.
 */
export function getBigQueryToJsType(bigqueryType: string): JsType {
	let normalized = bigqueryType.toUpperCase().trim();
	if (normalized.startsWith('STRUCT<') || normalized.startsWith('RECORD<')) {
		return 'object';
	}
	// Unwrap one level of ARRAY<...>.
	const wrapped = normalized.match(/^ARRAY<(.+)>$/);
	if (wrapped) {
		normalized = wrapped[1].trim();
		if (normalized.startsWith('STRUCT<') || normalized.startsWith('RECORD<')) {
			return 'object';
		}
	}
	normalized = normalized.replace(/\(.*\)/, '').trim();
	return BIGQUERY_TYPE_MAP[normalized] ?? 'unknown';
}
