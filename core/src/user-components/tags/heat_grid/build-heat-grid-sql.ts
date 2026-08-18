import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import { processColumnExpression } from '../../common/sql-expression-utils';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';

export interface HeatGridSQLAttrs extends BaseSQLAttrs {
	dimension: string;
	value: string;
	dialect?: SqlDialect;
}

export function buildHeatGridSQLConfig(attrs: HeatGridSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const dimensionProcessed = processColumnExpression(
		{
			value: attrs.dimension,
			type: 'dimension'
		},
		dialect
	);
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);

	return {
		tableExpressionName: attrs.data,
		columns: [dimensionProcessed, valueProcessed],
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order: attrs.order,
		limit: attrs.limit,
		date_range: attrs.date_range
	};
}

export function buildHeatGridSQL(attrs: HeatGridSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	const config = buildHeatGridSQLConfig(attrs);
	return generateSQLQuery(config, undefined, undefined, attrs.anchorDate, firstDayOfWeek, dialect);
}
