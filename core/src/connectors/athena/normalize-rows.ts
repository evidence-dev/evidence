import type { Column } from '../../user-components/interfaces/query-service';

// Structural subset of the SDK's `Row`.
export type AthenaRow = { Data?: { VarCharValue?: string }[] };

const DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?)?(?:\s.*)?$/;

// Drops any zone label, keeping the wall-clock time Athena rendered.
export function normalizeAthenaDate(value: string): string {
	const m = DATE_TIME_RE.exec(value);
	if (!m) return value;
	const [, date, time] = m;
	return !time || time === '00:00:00' ? date : `${date} ${time}`;
}

function coerce(value: string | undefined, jsType: Column['jsType']): unknown {
	// GetQueryResults omits VarCharValue for SQL NULL.
	if (value === undefined) return null;
	switch (jsType) {
		case 'number': {
			if (value.length === 0) return null;
			const n = Number(value);
			return Number.isFinite(n) ? n : null;
		}
		case 'boolean':
			return value === 'true' ? true : value === 'false' ? false : null;
		case 'date':
			return normalizeAthenaDate(value);
		default:
			return value;
	}
}

// GetQueryResults returns every cell as a string.
export function athenaRowsToObjects(
	rows: AthenaRow[],
	columns: Column[]
): Record<string, unknown>[] {
	return rows.map((row) => {
		const out: Record<string, unknown> = {};
		const data = row.Data ?? [];
		for (let i = 0; i < columns.length; i++) {
			out[columns[i].name] = coerce(data[i]?.VarCharValue, columns[i].jsType);
		}
		return out;
	});
}
