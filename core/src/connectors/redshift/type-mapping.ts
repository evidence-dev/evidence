import { getPostgresToJsType, type JsType } from '../postgres/type-mapping';

/**
 * Types Redshift reports (via SVV_COLUMNS) that the Postgres map doesn't know.
 * Local-table extras first, then the Hive/Glue type names Spectrum external
 * tables surface. Keys are upper-cased and stripped of any `(...)` suffix.
 */
const REDSHIFT_EXTRA_TYPE_MAP: Record<string, JsType> = {
	// SUPER arrives over the wire as serialized JSON text; treat as text rather
	// than guessing at its shape.
	SUPER: 'string',
	GEOMETRY: 'string',
	GEOGRAPHY: 'string',
	HLLSKETCH: 'string',
	VARBYTE: 'string',
	BINARY: 'string',
	// SVV_COLUMNS reports the long-form SQL names; TIME has no date part.
	'TIME WITHOUT TIME ZONE': 'string',
	'TIME WITH TIME ZONE': 'string',
	// Spectrum / Glue names.
	STRING: 'string',
	TINYINT: 'number',
	DOUBLE: 'number',
	FLOAT: 'number'
};

export function getRedshiftToJsType(redshiftType: string): JsType {
	const normalized = redshiftType
		.toUpperCase()
		.replace(/\(.*\)/, '')
		.trim();
	// Spectrum complex types (array<string>, struct<...>, map<...>).
	if (
		normalized.startsWith('ARRAY<') ||
		normalized.startsWith('STRUCT<') ||
		normalized.startsWith('MAP<')
	) {
		return 'object';
	}
	return REDSHIFT_EXTRA_TYPE_MAP[normalized] ?? getPostgresToJsType(redshiftType);
}
