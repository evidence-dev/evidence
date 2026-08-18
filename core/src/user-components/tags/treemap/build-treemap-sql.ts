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

export interface TreemapSQLAttrs extends BaseSQLAttrs {
	category: string;
	value: string;
	group?: string;
	dialect?: SqlDialect;
	tooltipFieldColumns?: readonly ProcessedColumnExpression[];
}

export function buildTreemapSQLConfig(attrs: TreemapSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const categoryProcessed = processColumnExpression({ value: attrs.category }, dialect);
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);
	const groupProcessed = attrs.group
		? processColumnExpression({ value: attrs.group }, dialect)
		: null;

	const primaryColumns: ProcessedColumnExpression[] = groupProcessed
		? [groupProcessed, categoryProcessed, valueProcessed]
		: [categoryProcessed, valueProcessed];

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

export function buildTreemapSQL(attrs: TreemapSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildTreemapSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
