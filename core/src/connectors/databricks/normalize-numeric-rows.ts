// The @databricks/sql driver returns DECIMAL as a string (to preserve precision)
// and BIGINT as a JS `bigint`. Coerce here so downstream components see JS
// Numbers like every other warehouse. Non-finite / un-parseable values map to
// `null` (never a silent 0, which would corrupt aggregates). Finite numbers pass
// through untouched.
export function normalizeNumericRows(
	rows: Record<string, unknown>[],
	numericColumnNames: Set<string>
): void {
	if (numericColumnNames.size === 0) return;
	for (const row of rows) {
		for (const col of numericColumnNames) {
			const val = row[col];
			if (val === null || val === undefined) continue;

			if (typeof val === 'number') {
				if (!Number.isFinite(val)) row[col] = null;
				continue;
			}

			if (typeof val === 'bigint') {
				const n = Number(val);
				row[col] = Number.isFinite(n) ? n : null;
				continue;
			}

			if (typeof val === 'string') {
				if (val.length === 0) {
					row[col] = null;
					continue;
				}
				const n = Number(val);
				row[col] = Number.isFinite(n) ? n : null;
			}
		}
	}
}
