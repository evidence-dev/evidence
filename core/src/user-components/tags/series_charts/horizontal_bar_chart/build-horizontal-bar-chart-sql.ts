import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../../common/sql-options';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../../common/sql-expression-utils';
import type { DateGrain } from '../../../common/date-options';
import type { SqlDialect } from '../../../../sql-dialect';
import { defaultDialect } from '../../../../sql-dialect';
import { dedupeTooltipColumns } from '../../../common/tooltip-fields';

export interface HorizontalBarChartSQLAttrs extends BaseSQLAttrs {
	/** Value (horizontal axis) column. */
	x: string;
	/** Category (vertical axis) column. */
	y: string;
	series?: string;
	/** Applies to the y (category) column when y is a date. */
	date_grain?: DateGrain | string;
	/** Category sort: 'asc' | 'desc' | 'data' | string[] (client-side array sort). */
	y_sort?: string | readonly string[];
	/**
	 * Unified sort prop (axis names match the horizontal chart's axes). Accepts:
	 *   - "x asc" / "x desc" — sort by the value axis (bars biggest/smallest first)
	 *   - "y asc" / "y desc" — sort by the category axis label
	 *   - string[]           — explicit category order (SQL emits stable ORDER BY y;
	 *                          the chart layer reorders client-side).
	 * Takes precedence over `y_sort` and `order` when set.
	 */
	sort?: string | readonly string[];
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
	/**
	 * When true, drop the `LIMIT` clause from the generated SQL. Reserved for
	 * future multi-series/cross-child unified sort — currently horizontal charts
	 * only have one query, so this is unused but kept API-symmetrical with
	 * `build-chart-sql.ts`.
	 */
	skipLimit?: boolean;
}

export function buildHorizontalBarChartSQLConfig(
	attrs: HorizontalBarChartSQLAttrs
): SQLQueryConfig {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;

	const xProcessed = processColumnExpression({ value: attrs.x }, dialect);
	const yProcessed = processColumnExpression(
		{
			value: attrs.y,
			dateGrain: attrs.date_grain,
			firstDayOfWeek
		},
		dialect
	);
	const seriesProcessed = attrs.series
		? processColumnExpression({ value: attrs.series }, dialect)
		: null;

	const xColumnName = xProcessed.alias;
	const yColumnName = yProcessed.alias;

	const primaryColumns: ProcessedColumnExpression[] = [yProcessed, xProcessed];
	if (seriesProcessed) primaryColumns.push(seriesProcessed);

	const tooltipColumns = dedupeTooltipColumns(primaryColumns, attrs.tooltipFieldColumns);

	// Non-aggregating passthrough: same rule as build-chart-sql — none of the
	// primary OR tooltip columns aggregate → skip GROUP BY and skip any default
	// ORDER BY so the user's inline `ORDER BY` propagates through unchanged.
	const anyColumnAggregates =
		primaryColumns.some((c) => c.hasAgg) || tooltipColumns.some((c) => c.hasAgg);
	const skipGroupBy = !anyColumnAggregates;

	// Resolve the SQL ORDER BY clause. Precedence (highest wins):
	//   1. `sort` (new unified prop; matches combo_chart family)
	//   2. `y_sort` (legacy — the category-axis sort, still supported)
	//   3. `order` (raw SQL escape hatch)
	//   4. Non-aggregating chart with no explicit sort → no default ORDER BY
	//   5. Aggregating chart with no explicit sort → `ORDER BY x DESC`
	//      (bars biggest first is the historical default; unchanged)
	let order: string | undefined;
	if (attrs.sort) {
		if (Array.isArray(attrs.sort)) {
			// Emit ORDER BY y (category) so LIMIT stays deterministic; the
			// chart layer reorders against the explicit array client-side.
			order = yColumnName;
		} else if (attrs.sort === 'x asc' || attrs.sort === 'x desc') {
			const direction = attrs.sort.slice(2);
			order = `${xColumnName} ${direction}`;
		} else if (attrs.sort === 'y asc' || attrs.sort === 'y desc') {
			const direction = attrs.sort.slice(2);
			order = `${yColumnName} ${direction}`;
		}
	} else if (attrs.y_sort) {
		if (Array.isArray(attrs.y_sort)) {
			order = yColumnName;
		} else if (attrs.y_sort === 'data') {
			order = undefined;
		} else {
			order = yColumnName ? `${yColumnName} ${attrs.y_sort}` : undefined;
		}
	} else if (attrs.order) {
		order = attrs.order;
	} else if (!skipGroupBy) {
		// Historical default for horizontal bars: biggest first (value DESC).
		order = `${xColumnName} desc`;
	}
	// Non-aggregating chart with no explicit sort → order stays undefined,
	// and the user's inline ORDER BY propagates through the outer SELECT.

	// Pre-existing quirk: legacy `y_sort` unset + `series` set appends the
	// series column to ORDER BY for stable stack rendering. Kept for
	// backward compatibility; new `sort` prop bypasses this.
	if (attrs.series && !attrs.sort && !attrs.order && !attrs.y_sort && order) {
		order += `, ${attrs.series}`;
	}

	return {
		tableExpressionName: attrs.data,
		columns: [...primaryColumns, ...tooltipColumns],
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order,
		limit: attrs.skipLimit ? undefined : attrs.limit,
		date_range: attrs.date_range,
		skipGroupBy
	};
}

export function buildHorizontalBarChartSQL(
	attrs: HorizontalBarChartSQLAttrs
): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildHorizontalBarChartSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
