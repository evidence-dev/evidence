import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import { processColumnExpression } from '../../common/sql-expression-utils';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';

export interface ProgressBarsSQLAttrs extends BaseSQLAttrs {
	dimension: string;
	numerator: string;
	denominator: string;
	dialect?: SqlDialect;
}

export function buildProgressBarsSQLConfig(attrs: ProgressBarsSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const dimensionProcessed = processColumnExpression(
		{
			value: attrs.dimension,
			type: 'dimension'
		},
		dialect
	);
	const numeratorProcessed = processColumnExpression({ value: attrs.numerator }, dialect);
	const denominatorProcessed = processColumnExpression({ value: attrs.denominator }, dialect);

	return {
		tableExpressionName: attrs.data,
		columns: [dimensionProcessed, numeratorProcessed, denominatorProcessed],
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order: attrs.order,
		limit: attrs.limit,
		date_range: attrs.date_range
	};
}

export function buildProgressBarsSQL(attrs: ProgressBarsSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildProgressBarsSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
