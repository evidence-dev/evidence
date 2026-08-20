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

export interface ChordChartSQLAttrs extends BaseSQLAttrs {
	source: string;
	target: string;
	value: string;
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
}

export function buildChordChartSQLConfig(attrs: ChordChartSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const sourceProcessed = processColumnExpression({ value: attrs.source }, dialect);
	const targetProcessed = processColumnExpression({ value: attrs.target }, dialect);
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);

	const primaryColumns: ProcessedColumnExpression[] = [
		sourceProcessed,
		targetProcessed,
		valueProcessed
	];

	const order = attrs.order ? attrs.order : `${valueProcessed.alias} DESC`;

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

export function buildChordChartSQL(attrs: ChordChartSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildChordChartSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
