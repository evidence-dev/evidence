/**
 * Normalize BigQuery-returned date values in place so consumers see the same
 * shape the managed ClickHouse engine and Snowflake native path emit:
 * "YYYY-MM-DD" for midnight, otherwise "YYYY-MM-DD HH:MM:SS".
 *
 * @google-cloud/bigquery wraps DATE/DATETIME/TIMESTAMP/TIME values in objects
 * with a `.value` string. TIME (`HH:MM:SS[.fff]`) passes through unchanged
 * because there's no calendar component to format.
 */

type BigQueryWrapped = { value: unknown };

function unwrapValue(val: unknown): string | Date | null {
	if (val instanceof Date) return val;
	if (typeof val === 'string') return val;
	if (val && typeof val === 'object' && typeof (val as BigQueryWrapped).value === 'string') {
		return (val as { value: string }).value;
	}
	return null;
}

/**
 * Whether a string looks like a TIME-only value (no calendar component).
 * BQ TIME `.value` is `HH:MM:SS[.fff]`. We pass these through untouched.
 */
function isTimeOnly(s: string): boolean {
	return /^\d{2}:\d{2}:\d{2}/.test(s) && !s.includes('-');
}

export function normalizeDateRows(
	rows: Record<string, unknown>[],
	dateColumnNames: Set<string>
): void {
	if (dateColumnNames.size === 0) return;
	for (const row of rows) {
		for (const col of dateColumnNames) {
			const raw = row[col];
			if (raw === null || raw === undefined) continue;
			const unwrapped = unwrapValue(raw);
			if (unwrapped === null) continue;

			let d: Date | null = null;
			if (unwrapped instanceof Date) {
				d = unwrapped;
			} else if (typeof unwrapped === 'string') {
				if (isTimeOnly(unwrapped)) {
					row[col] = unwrapped;
					continue;
				}
				// BQ DATETIME has no zone; appending Z parses as UTC, matching
				// the way TIMESTAMP (which already has Z) round-trips.
				const candidate = unwrapped.includes('T') || unwrapped.endsWith('Z')
					? unwrapped
					: unwrapped.replace(' ', 'T') + 'Z';
				const parsed = new Date(candidate);
				if (!isNaN(parsed.getTime())) d = parsed;
			}

			if (d) {
				const iso = d.toISOString();
				const isMidnight =
					d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
				row[col] = isMidnight
					? iso.slice(0, 10)
					: iso
							.replace('T', ' ')
							.replace('Z', '')
							.replace(/\.\d{3}$/, '');
			}
		}
	}
}
