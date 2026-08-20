// @google-cloud/bigquery wraps NUMERIC/BIGNUMERIC in `Big` instances unconditionally.
// Coerce here so downstream components see JS Numbers like every other warehouse.

function looksLikeBigInstance(val: unknown): boolean {
	if (!val || typeof val !== 'object') return false;
	const b = val as { c?: unknown; e?: unknown; s?: unknown };
	return Array.isArray(b.c) && typeof b.e === 'number' && typeof b.s === 'number';
}

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

			if (looksLikeBigInstance(val)) {
				const n = Number((val as { toString: () => string }).toString());
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
