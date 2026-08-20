/**
 * Parse Evidence sparkline columns from BigQuery into the tuple-of-tuples
 * shape that ClickHouse (`groupArray((x, y))`) and Snowflake
 * (`ARRAY_AGG(ARRAY_CONSTRUCT(x, y))`) already produce: `[[x, y], ...]`.
 *
 * The BigQuery dialect emits these as a single JSON string per row
 * (`TO_JSON_STRING(ARRAY_AGG(JSON_ARRAY(x_val, y_val) ORDER BY x_val))`) so
 * we just need to JSON.parse the value — BQ's JSON serializer already
 * renders DATE/TIMESTAMP as the canonical strings consumers expect.
 *
 * Columns are identified via `isSparklineColumnId`, which matches the
 * reserved `__ev_sparkline_` prefix that `generateSparklineId` emits.
 */

import type { Column } from '../user-components/interfaces/query-service';
import { isSparklineColumnId } from '../user-components/common/build-sparklines';

export function normalizeSparklineRows(
	rows: Record<string, unknown>[],
	columns: Column[]
): void {
	const sparklineCols = columns.filter((c) => isSparklineColumnId(c.name)).map((c) => c.name);
	if (sparklineCols.length === 0) return;

	for (const row of rows) {
		for (const col of sparklineCols) {
			const raw = row[col];
			if (typeof raw !== 'string') continue;
			try {
				row[col] = JSON.parse(raw);
			} catch {
				row[col] = null;
			}
		}
	}
}
