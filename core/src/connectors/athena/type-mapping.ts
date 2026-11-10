import type { JsType } from '../postgres/type-mapping';

// Keys are lower-cased with any `(...)` precision suffix stripped before lookup.
const ATHENA_TYPE_MAP: Record<string, JsType> = {
	boolean: 'boolean',

	tinyint: 'number',
	smallint: 'number',
	integer: 'number',
	int: 'number',
	bigint: 'number',
	real: 'number',
	float: 'number',
	double: 'number',
	decimal: 'number',

	varchar: 'string',
	char: 'string',
	string: 'string',
	varbinary: 'string',
	json: 'string',
	uuid: 'string',
	ipaddress: 'string',
	time: 'string',
	'time with time zone': 'string',
	'interval year to month': 'string',
	'interval day to second': 'string',

	date: 'date',
	timestamp: 'date',
	'timestamp with time zone': 'date',

	// GetQueryResults renders complex values as Trino text (`[a, b]`), not JSON.
	array: 'string',
	map: 'string',
	row: 'string',
	struct: 'string'
};

export function getAthenaToJsType(athenaType: string): JsType {
	const normalized = athenaType
		.toLowerCase()
		.replace(/\(.*\)/, '')
		.replace(/<.*>/, '')
		.trim();
	return ATHENA_TYPE_MAP[normalized] ?? 'unknown';
}
