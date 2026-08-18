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
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
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

	let order: string | undefined;
	if (attrs.y_sort) {
		if (Array.isArray(attrs.y_sort)) {
			order = yColumnName;
		} else if (attrs.y_sort === 'data') {
			order = undefined;
		} else {
			order = yColumnName ? `${yColumnName} ${attrs.y_sort}` : undefined;
		}
	} else {
		// TODO: BUG - with date_grain on y, default sort is still `value desc` instead of chronological on y. bar_chart special-cases temporal x; this should match.
		order = attrs.order ? attrs.order : `${xColumnName} desc`;
	}

	// TODO: BUG - appends raw `attrs.series` to ORDER BY instead of seriesProcessed.alias. Simple columns work (alias === raw); expression-valued series (e.g. CASE) would put a different string in ORDER BY than SELECT. Pre-existing from HorizontalBarChart.svelte; same pattern in build-chart-sql.ts.
	if (attrs.series && !attrs.order && !attrs.y_sort && order) {
		order += `, ${attrs.series}`;
	}

	const primaryColumns: ProcessedColumnExpression[] = [yProcessed, xProcessed];
	if (seriesProcessed) primaryColumns.push(seriesProcessed);

	return {
		tableExpressionName: attrs.data,
		columns: [
			...primaryColumns,
			...dedupeTooltipColumns(primaryColumns, attrs.tooltipFieldColumns)
		],
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order,
		limit: attrs.limit,
		date_range: attrs.date_range
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
