export type JsType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

/**
 * Postgres type name → Evidence column JsType. Keys are upper-cased and stripped
 * of any `(...)` precision/length suffix before lookup (see getPostgresToJsType).
 * The Studio client and CLI translate the driver's numeric type OID into these
 * friendly names via PG_OID_TO_NAME before calling in, so this stays driver-
 * agnostic and unit-testable. Shared by every Postgres-wire flavour (generic
 * Postgres, RDS/Aurora, Supabase, Neon, …); flavour-specific dialects override
 * only where the SQL differs, not the type map.
 */
const POSTGRES_TYPE_MAP: Record<string, JsType> = {
	BOOL: 'boolean',
	BOOLEAN: 'boolean',

	INT2: 'number',
	INT4: 'number',
	INT8: 'number',
	SMALLINT: 'number',
	INTEGER: 'number',
	INT: 'number',
	BIGINT: 'number',
	FLOAT4: 'number',
	FLOAT8: 'number',
	REAL: 'number',
	'DOUBLE PRECISION': 'number',
	NUMERIC: 'number',
	DECIMAL: 'number',
	OID: 'number',
	// node-postgres has no parser for MONEY (OID 790); it returns a locale-formatted
	// string ("$1,234.56") that Number() can't parse — so treat it as text to avoid
	// silently nulling every value. Users needing arithmetic cast: `col::numeric`.
	MONEY: 'string',

	TEXT: 'string',
	VARCHAR: 'string',
	'CHARACTER VARYING': 'string',
	CHAR: 'string',
	BPCHAR: 'string',
	CHARACTER: 'string',
	NAME: 'string',
	UUID: 'string',
	BYTEA: 'string',
	// Network / bit / geometric types stringify cleanly; treat as text.
	INET: 'string',
	CIDR: 'string',
	MACADDR: 'string',
	// An INTERVAL comes back from node-postgres as an object, but renders as a
	// text label everywhere it's displayed — treat as text.
	INTERVAL: 'string',

	DATE: 'date',
	TIMESTAMP: 'date',
	'TIMESTAMP WITHOUT TIME ZONE': 'date',
	TIMESTAMPTZ: 'date',
	'TIMESTAMP WITH TIME ZONE': 'date',
	// TIME has no date part; keep it as a text label rather than a bogus date.
	TIME: 'string',
	TIMETZ: 'string',

	JSON: 'object',
	JSONB: 'object'
};

export function getPostgresToJsType(postgresType: string): JsType {
	const normalized = postgresType
		.toUpperCase()
		.replace(/\(.*\)/, '')
		.replace(/\[\]$/, '')
		.trim();
	// Arrays deserialize to JS arrays regardless of element type.
	if (postgresType.trim().endsWith('[]') || normalized.startsWith('_')) return 'object';
	return POSTGRES_TYPE_MAP[normalized] ?? 'unknown';
}

/**
 * node-postgres reports each column's type only as a numeric OID (`field.dataTypeID`),
 * never a name. Map the common built-in OIDs to the friendly names above so both
 * the Studio client and the CLI adapter can share one type map. Unknown OIDs fall
 * back to `'unknown'` (→ rendered as text), which is safe.
 *
 * OIDs are stable Postgres catalog constants (pg_type.oid) — Redshift and Cube,
 * being Postgres-wire, reuse the same values for the built-in types.
 */
export const PG_OID_TO_NAME: Record<number, string> = {
	16: 'BOOL',
	17: 'BYTEA',
	18: 'CHAR',
	19: 'NAME',
	20: 'INT8',
	21: 'INT2',
	23: 'INT4',
	25: 'TEXT',
	26: 'OID',
	114: 'JSON',
	700: 'FLOAT4',
	701: 'FLOAT8',
	790: 'MONEY',
	1042: 'BPCHAR',
	1043: 'VARCHAR',
	1082: 'DATE',
	1083: 'TIME',
	1114: 'TIMESTAMP',
	1184: 'TIMESTAMPTZ',
	1186: 'INTERVAL',
	1266: 'TIMETZ',
	1700: 'NUMERIC',
	2950: 'UUID',
	3802: 'JSONB',
	869: 'INET',
	650: 'CIDR',
	829: 'MACADDR'
};
