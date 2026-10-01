/**
 * Normalize Snowflake-returned date values in place so consumers see the same
 * shape the managed ClickHouse engine emits: "YYYY-MM-DD" for midnight, otherwise
 * "YYYY-MM-DD HH:MM:SS". The Snowflake SDK returns Date objects that serialize
 * as "2025-05-22 14:59:12.000 +0000", which charts can't parse.
 */
export function normalizeDateRows(
	rows: Record<string, unknown>[],
	dateColumnNames: Set<string>
): void {
	if (dateColumnNames.size === 0) return;
	for (const row of rows) {
		for (const col of dateColumnNames) {
			const val = row[col];
			let d: Date | null = null;
			if (val instanceof Date) {
				d = shiftToStoredOffset(val);
			} else if (typeof val === 'string') {
				d = new Date(val);
				if (isNaN(d.getTime())) d = null;
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

// The SDK exposes a numeric offset (minutes) only for TIMESTAMP_TZ; NTZ/LTZ return zone names.
function shiftToStoredOffset(d: Date): Date {
	const offsetMinutes = (d as Date & { getTimezone?: () => unknown }).getTimezone?.();
	if (typeof offsetMinutes !== 'number' || offsetMinutes === 0) return d;
	return new Date(d.getTime() + offsetMinutes * 60_000);
}
