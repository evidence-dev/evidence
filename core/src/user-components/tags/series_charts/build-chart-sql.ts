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
	dialect?: SqlDialect;
	/**
	 * Additional processed columns appended to the SELECT solely for tooltip
	 * rendering. These are aggregated at the same (x, series) grain as the
	 * primary y column via the shared GROUP BY, so their values are safe to
	 * attach to each rendered data point.
	 */
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
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
	const sizeProcessed = attrs.size
		? processColumnExpression({ value: attrs.size }, dialect)
		: null;

	const xColumnName = xProcessed?.alias;

	// x_sort='data' + series appends series to ORDER BY — preserves pre-refactor
	// quirk; fix in a follow-up if unwanted.
	let order: string | undefined;
	if (attrs.x_sort) {
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
	} else {
		order = attrs.order ? attrs.order : xColumnName;
	}

	const primaryColumns = [
		xProcessed,
		yProcessed,
		seriesProcessed,
		sizeProcessed,
		pointTitleProcessed
	].filter((c): c is ProcessedColumnExpression => c !== null);

	const columns = [
		...primaryColumns,
		...dedupeTooltipColumns(primaryColumns, attrs.tooltipFieldColumns)
	];

	return {
		tableExpressionName: attrs.data,
		columns,
		filterIds: attrs.filters,
		where: attrs.where,
		date_range: attrs.date_range,
		having: attrs.having,
		qualify: attrs.qualify,
		order,
		limit: attrs.limit
	};
}

export function buildChartSQL(attrs: ChartSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	const config = buildChartSQLConfig(attrs);
	return generateSQLQuery(config, undefined, undefined, attrs.anchorDate, firstDayOfWeek, dialect);
}
