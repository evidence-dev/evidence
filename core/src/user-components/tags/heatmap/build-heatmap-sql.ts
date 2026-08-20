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

export interface HeatmapSQLAttrs extends BaseSQLAttrs {
	x: string;
	y: string;
	value: string;
	x_date_grain?: DateGrain | string;
	y_date_grain?: DateGrain | string;
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
}

export function buildHeatmapSQLConfig(attrs: HeatmapSQLAttrs): SQLQueryConfig {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;

	const xProcessed = processColumnExpression(
		{
			value: attrs.x,
			dateGrain: attrs.x_date_grain,
			firstDayOfWeek
		},
		dialect
	);
	const yProcessed = processColumnExpression(
		{
			value: attrs.y,
			dateGrain: attrs.y_date_grain,
			firstDayOfWeek
		},
		dialect
	);
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);
	const order = attrs.order ? attrs.order : `${valueProcessed.alias} DESC`;

	const primaryColumns = [xProcessed, yProcessed, valueProcessed];

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

export function buildHeatmapSQL(attrs: HeatmapSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildHeatmapSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
