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
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';
import { dedupeTooltipColumns } from '../../common/tooltip-fields';

export interface CalendarHeatmapSQLAttrs extends BaseSQLAttrs {
	date: string;
	value: string;
	conditional_colors?: string;
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
}

export function buildCalendarHeatmapSQLConfig(
	attrs: CalendarHeatmapSQLAttrs
): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const dateProcessed = processColumnExpression({ value: attrs.date }, dialect);
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);
	const conditionalColorsProcessed = attrs.conditional_colors
		? processColumnExpression({ value: attrs.conditional_colors }, dialect)
		: null;

	const primaryColumns: ProcessedColumnExpression[] = [dateProcessed, valueProcessed];
	if (conditionalColorsProcessed) primaryColumns.push(conditionalColorsProcessed);

	const columns = [
		...primaryColumns,
		...dedupeTooltipColumns(primaryColumns, attrs.tooltipFieldColumns)
	];

	const order = attrs.order ? attrs.order : `${dateProcessed.alias} ASC`;

	return {
		tableExpressionName: attrs.data,
		columns,
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order,
		limit: attrs.limit,
		date_range: attrs.date_range
	};
}

export function buildCalendarHeatmapSQL(attrs: CalendarHeatmapSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	const config = buildCalendarHeatmapSQLConfig(attrs);
	return generateSQLQuery(config, undefined, undefined, attrs.anchorDate, firstDayOfWeek, dialect);
}
