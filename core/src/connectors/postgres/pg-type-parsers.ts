/**
 * OIDs we force node-postgres to return as their raw Postgres **string** instead
 * of its default parsed shape, because the parsed shape mismatches the jsType
 * Evidence assigns (and downstream components expect a string):
 *
 *  - 1082 date / 1114 timestamp / 1184 timestamptz — node-pg builds a JS `Date`;
 *    for a no-tz timestamp that Date is in the *Node process* timezone, so
 *    formatting it as UTC shifts it (wrong wall-clock/day) on any non-UTC host.
 *    As a string, normalize-date-rows formats it deterministically.
 *  - 1186 interval — node-pg returns a `{years,months,…}` object, but we type it
 *    `string`; the raw text ("1 year 2 mons 3 days 04:05:06") renders correctly.
 *  - 17 bytea — node-pg returns a Node `Buffer`; the raw `\x…` hex text is what a
 *    `string` column should carry.
 *
 * TIME/TIMETZ/ranges already come back as strings by pg default.
 */
export const POSTGRES_RAW_STRING_OIDS: ReadonlySet<number> = new Set([1082, 1114, 1184, 1186, 17]);

type TypeParser = (value: string) => unknown;

/**
 * Build a `getTypeParser` for the pg client's `types` config that returns the
 * raw string for date/timestamp OIDs and defers to the driver's default parser
 * for everything else. Parameterized on the fallback so core needs no `pg`
 * dependency; each client passes `pg.types.getTypeParser`. MUST be applied
 * per-pool, never via the global `pg.types.setTypeParser` (Studio uses `pg` for
 * other things).
 */
export function makePostgresTypeParser<F>(
	fallback: (oid: number, format?: F) => TypeParser
): (oid: number, format?: F) => TypeParser {
	const identity: TypeParser = (v) => v;
	return (oid, format) => (POSTGRES_RAW_STRING_OIDS.has(oid) ? identity : fallback(oid, format));
}

/**
 * A `SET search_path TO …` statement, run once per new pooled connection.
 *
 * We deliberately do NOT set search_path via the libpq `options` startup
 * parameter (`-c search_path=…`): connection poolers (Neon, Supabase, PgBouncer)
 * reject unknown startup parameters in `options` and fail the connection outright
 * ("unsupported startup parameter in options: search_path"). A plain `SET` runs
 * as a normal statement that poolers accept.
 *
 * The schema is user-configured, so guard against injection: plain identifiers
 * are passed bare (case-folding matches Postgres); anything else is double-quoted
 * with embedded quotes doubled, so the whole value stays a single identifier.
 */
export function pgSetSearchPathStatement(schema: string): string {
	// Always double-quote. An unquoted name that happens to be a reserved keyword
	// (`user`, `order`, …) would be misinterpreted rather than treated as the
	// schema, and unquoted mixed-case names get folded to lowercase. Quoting makes
	// it the literal schema identifier (embedded quotes doubled). This is also
	// injection-safe: the value can never break out of the identifier.
	return `SET search_path TO "${schema.replace(/"/g, '""')}"`;
}
