// Collapse Postgres date/timestamp values to the canonical Evidence date shape
// ("YYYY-MM-DD" at midnight, else "YYYY-MM-DD HH:MM:SS").
//
// The client returns DATE / TIMESTAMP / TIMESTAMPTZ as raw strings (see
// pg-type-parsers) precisely so we DON'T round-trip a `timestamp without time
// zone` through a JS `Date`, which would reinterpret its wall-clock time in the
// Node process timezone and shift it on any non-UTC host. So:
//   - a string with an explicit offset (timestamptz, e.g. `…+00`, `…-05`, `…Z`)
//     is a real instant → parse it and render in UTC;
//   - a string with NO offset (timestamp / date) is wall-clock → keep it as-is,
//     never through `Date`;
//   - a `Date` (defensive fallback, e.g. if parsers weren't applied) → render UTC.
export function normalizeDateRows(
	rows: Record<string, unknown>[],
	dateColumnNames: Set<string>
): void {
	if (dateColumnNames.size === 0) return;
	for (const row of rows) {
		for (const col of dateColumnNames) {
			const val = row[col];
			if (val instanceof Date) {
				row[col] = formatInstantUtc(val);
			} else if (typeof val === 'string') {
				row[col] = normalizeDateString(val);
			}
		}
	}
}

// Trailing tz offset: Z, ±HH, ±HH:MM, or ±HH:MM:SS (Postgres emits second-level
// offsets for some historical/LMT zones).
const OFFSET_RE = /(?:Z|[+-]\d{2}(?::?\d{2}(?::?\d{2})?)?)$/;

function normalizeDateString(raw: string): string {
	const s = raw.trim();
	// Date-only.
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
	// Has an explicit timezone offset → real instant; parse and render UTC.
	if (OFFSET_RE.test(s)) {
		const d = new Date(s);
		return isNaN(d.getTime()) ? s : formatInstantUtc(d);
	}
	// Wall-clock (no offset) → normalize the format only; never via `Date`.
	const cleaned = s.replace('T', ' ').replace(/\.\d+/, '');
	const m = cleaned.match(/^(\d{4}-\d{2}-\d{2}) 00:00:00$/);
	return m ? m[1] : cleaned;
}

function formatInstantUtc(d: Date): string {
	const iso = d.toISOString();
	const isMidnight =
		d.getUTCHours() === 0 &&
		d.getUTCMinutes() === 0 &&
		d.getUTCSeconds() === 0 &&
		d.getUTCMilliseconds() === 0;
	return isMidnight
		? iso.slice(0, 10)
		: iso
				.replace('T', ' ')
				.replace('Z', '')
				.replace(/\.\d{3}$/, '');
}
