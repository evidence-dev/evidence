import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../common/sql-expression-utils';
import type { DateGrain } from '../../common/date-options';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';
import { dedupeTooltipColumns } from '../../common/tooltip-fields';

export interface ChartSQLAttrs extends BaseSQLAttrs {
	x?: string;
	y: string;
	series?: string;
	size?: string;
	point_title?: string;
	date_grain?: DateGrain | string;
	x_sort?: string | readonly string[];
	/**
	 * Unified sort prop. Accepts:
	 *   - "x asc" / "x desc" — sort by x-axis column
	 *   - "y asc" / "y desc" — sort by y expression (resolves to the y alias so
	 *                          aggregates like sum(sales) sort by sum_sales)
	 *   - string[]           — explicit category order. SQL still emits a stable
	 *                          ORDER BY x; the chart layer reorders client-side
	 *                          so every child in a combo lines up on the same
	 *                          category order.
	 * Takes precedence over `x_sort` and `order` when set.
	 */
	sort?: string | readonly string[];
	dialect?: SqlDialect;
	/**
	 * Additional processed columns appended to the SELECT solely for tooltip
	 * rendering. These are aggregated at the same (x, series) grain as the
	 * primary y column via the shared GROUP BY, so their values are safe to
	 * attach to each rendered data point.
	 */
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
	/**
	 * When true, drop the `LIMIT` clause from the generated SQL. Used by
	 * ComboChart when it needs the full result set to compute a cross-child
	 * ordering (e.g. `sort="y desc"` on a multi-child combo) before applying
	 * the top-N truncation client-side. Individual per-series LIMITs would
	 * produce inconsistent partial contributions and rank the wrong x values.
	 */
	skipLimit?: boolean;
}

export function buildChartSQLConfig(attrs: ChartSQLAttrs): SQLQueryConfig {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;

	const xProcessed = attrs.x
		? processColumnExpression(
				{
					value: attrs.x,
					dateGrain: attrs.date_grain,
					firstDayOfWeek
				},
				dialect
			)
		: null;

	const pointTitleProcessed = attrs.point_title
		? processColumnExpression({ value: attrs.point_title }, dialect)
		: null;

	const yProcessed = processColumnExpression({ value: attrs.y }, dialect);
	const seriesProcessed = attrs.series
		? processColumnExpression({ value: attrs.series }, dialect)
		: null;
	const sizeProcessed = attrs.size ? processColumnExpression({ value: attrs.size }, dialect) : null;

	const xColumnName = xProcessed?.alias;
	const yColumnName = yProcessed.alias;

	const primaryColumns = [
		xProcessed,
		yProcessed,
		seriesProcessed,
		sizeProcessed,
		pointTitleProcessed
	].filter((c): c is ProcessedColumnExpression => c !== null);

	const tooltipColumns = dedupeTooltipColumns(primaryColumns, attrs.tooltipFieldColumns);

	// A chart is "non-aggregating" when NEITHER the primary columns NOR any
	// tooltip column contain an aggregation function. Missing either side
	// causes a warehouse-side "mixed aggregate + bare column without GROUP BY"
	// rejection: e.g. bare x/y with `tooltip_fields=[{ value: "sum(profit)" }]`
	// would emit a valid-looking `SELECT x, y, sum(profit)` — no GROUP BY —
	// which every dialect rejects. In that shape the chart passes through the
	// user's source query row order (no GROUP BY, no default ORDER BY x).
	const anyColumnAggregates =
		primaryColumns.some((c) => c.hasAgg) || tooltipColumns.some((c) => c.hasAgg);
	const skipGroupBy = !anyColumnAggregates;

	// Resolve the SQL ORDER BY clause. Precedence (highest wins):
	//   1. `sort` (new unified prop)
	//   2. `x_sort` (legacy)
	//   3. `order` (raw SQL escape hatch)
	//   4. Non-aggregating chart with no explicit sort → no default ORDER BY
	//      so the source query's own ORDER BY propagates through the outer
	//      SELECT unchanged (the AI-writes-SQL-with-ORDER-BY case).
	//   5. Aggregating chart with no explicit sort → default ORDER BY x
	//      (unchanged from today; preserves determinism after GROUP BY).
	let order: string | undefined;
	if (attrs.sort) {
		if (Array.isArray(attrs.sort)) {
			// Emit ORDER BY x so LIMIT stays deterministic; the chart layer
			// reorders against the explicit array client-side (see ComboChart).
			order = xColumnName;
		} else if (attrs.sort === 'x asc' || attrs.sort === 'x desc') {
			const direction = attrs.sort.slice(2);
			order = xColumnName ? `${xColumnName} ${direction}` : undefined;
		} else if (attrs.sort === 'y asc' || attrs.sort === 'y desc') {
			const direction = attrs.sort.slice(2);
			// Reference the alias so aggregated y (`sum(...)`) resolves cleanly
			// and doesn't accidentally lift the raw column via the SELECT
			// order-column-lifter (which would break the aggregation).
			order = `${yColumnName} ${direction}`;
		}
	} else if (attrs.x_sort) {
		// x_sort='data' + series appends series to ORDER BY — preserves
		// pre-refactor quirk; the value is essentially unused in practice.
		if (Array.isArray(attrs.x_sort)) {
			order = xColumnName;
		} else if (attrs.x_sort === 'data') {
			if (attrs.series && xColumnName) {
				order = `${xColumnName}, ${attrs.series}`;
			} else {
				order = undefined;
			}
		} else {
			order = xColumnName ? `${xColumnName} ${attrs.x_sort}` : undefined;
		}
	} else if (attrs.order) {
		order = attrs.order;
	} else if (!skipGroupBy) {
		// Aggregating chart, no explicit sort → default alphabetical x. This
		// preserves today's behavior for the majority of charts.
		order = xColumnName;
	}
	// Non-aggregating chart with no explicit sort → order stays undefined,
	// and the user's inline ORDER BY propagates through the outer SELECT.

	const columns = [...primaryColumns, ...tooltipColumns];

	return {
		tableExpressionName: attrs.data,
		columns,
		filterIds: attrs.filters,
		where: attrs.where,
		date_range: attrs.date_range,
		having: attrs.having,
		qualify: attrs.qualify,
		order,
		limit: attrs.skipLimit ? undefined : attrs.limit,
		skipGroupBy
	};
}

export function buildChartSQL(attrs: ChartSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	const config = buildChartSQLConfig(attrs);
	return generateSQLQuery(config, undefined, undefined, attrs.anchorDate, firstDayOfWeek, dialect);
}
