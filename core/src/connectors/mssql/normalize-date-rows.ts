// Match the canonical Evidence date shape ("YYYY-MM-DD" at midnight, else
// "YYYY-MM-DD HH:MM:SS"). Check ms too so DATETIME2/DATETIMEOFFSET's sub-second
// precision isn't silently collapsed to a date.
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
				d = val;
			} else if (typeof val === 'string') {
				const parsed = new Date(val);
				if (!isNaN(parsed.getTime())) d = parsed;
			}
			if (d) {
				const iso = d.toISOString();
				const isMidnight =
					d.getUTCHours() === 0 &&
					d.getUTCMinutes() === 0 &&
					d.getUTCSeconds() === 0 &&
					d.getUTCMilliseconds() === 0;
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
