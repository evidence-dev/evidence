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

export const WATERFALL_SORT_OPTIONS = ['asc', 'desc', 'value_asc', 'value_desc'] as const;
export type WaterfallSortOption = (typeof WATERFALL_SORT_OPTIONS)[number];
export type WaterfallXSort = WaterfallSortOption | readonly string[];

export interface WaterfallChartSQLAttrs extends BaseSQLAttrs {
	x: string;
	y: string;
	bar_type?: string;
	breakdown?: string;
	date_grain?: DateGrain | string;
	x_sort?: WaterfallXSort;
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
}

/**
 * ORDER BY for the bars. Bar order is the story of a waterfall, so it is never
 * left to the database: pre-summarized rows (plain `y`) keep their source order,
 * aggregated rows (which have no source order) default to largest change first.
 */
export function resolveWaterfallOrder(args: {
	xSort: WaterfallXSort | undefined;
	order: string | undefined;
	xAlias: string;
	yAlias: string;
	aggregated: boolean;
	/** Breakdown mode: `x` values are totals in sequence, so only their order is meaningful. */
	breakdown?: boolean;
}): string | undefined {
	if (args.order) return args.order;
	const { xSort } = args;
	// Label lists are applied client-side; only aggregated rows need SQL order for the leftovers.
	if (Array.isArray(xSort)) return args.aggregated ? args.xAlias : undefined;
	if (args.breakdown) return `${args.xAlias} ${xSort === 'desc' ? 'DESC' : 'ASC'}`;
	switch (xSort) {
		case 'asc':
			return `${args.xAlias} ASC`;
		case 'desc':
			return `${args.xAlias} DESC`;
		case 'value_asc':
			return `${args.yAlias} ASC`;
		case 'value_desc':
			return `${args.yAlias} DESC`;
		default:
			return args.aggregated ? `${args.yAlias} DESC` : undefined;
	}
}

export function buildWaterfallChartSQLConfig(attrs: WaterfallChartSQLAttrs): SQLQueryConfig {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;

	const xProcessed = processColumnExpression(
		{ value: attrs.x, dateGrain: attrs.date_grain, firstDayOfWeek },
		dialect
	);
	const yProcessed = processColumnExpression({ value: attrs.y }, dialect);
	const barTypeProcessed = attrs.bar_type
		? processColumnExpression({ value: attrs.bar_type }, dialect)
		: null;
	const breakdownProcessed = attrs.breakdown
		? processColumnExpression({ value: attrs.breakdown }, dialect)
		: null;

	const primaryColumns: ProcessedColumnExpression[] = [xProcessed, yProcessed];
	if (barTypeProcessed) primaryColumns.push(barTypeProcessed);
	if (breakdownProcessed) primaryColumns.push(breakdownProcessed);

	const aggregated = yProcessed.hasAgg;
	// An aggregate tooltip field on plain rows still needs the GROUP BY.
	const tooltipAggregates = (attrs.tooltipFieldColumns ?? []).some((c) => c.hasAgg);

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
		order: resolveWaterfallOrder({
			xSort: attrs.x_sort,
			order: attrs.order,
			xAlias: xProcessed.alias,
			yAlias: yProcessed.alias,
			aggregated,
			breakdown: Boolean(breakdownProcessed)
		}),
		limit: attrs.limit,
		date_range: attrs.date_range,
		// Pre-summarized rows are looked up, not aggregated: GROUP BY would lose their source order.
		skipGroupBy: !aggregated && !tooltipAggregates
	};
}

export function buildWaterfallChartSQL(attrs: WaterfallChartSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildWaterfallChartSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
