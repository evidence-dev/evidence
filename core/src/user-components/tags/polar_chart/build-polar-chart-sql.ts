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

/** Polar chart only applies ORDER BY when explicitly provided. */
export interface PolarChartSQLAttrs extends BaseSQLAttrs {
	category: string;
	value: string;
	series?: string;
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
}

export function buildPolarChartSQLConfig(attrs: PolarChartSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const categoryProcessed = processColumnExpression({ value: attrs.category }, dialect);
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);
	const seriesProcessed = attrs.series
		? processColumnExpression({ value: attrs.series }, dialect)
		: null;

	const primaryColumns: ProcessedColumnExpression[] = seriesProcessed
		? [categoryProcessed, seriesProcessed, valueProcessed]
		: [categoryProcessed, valueProcessed];

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
		order: attrs.order,
		limit: attrs.limit,
		date_range: attrs.date_range
	};
}

export function buildPolarChartSQL(attrs: PolarChartSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildPolarChartSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
