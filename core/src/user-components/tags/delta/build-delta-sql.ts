import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import { processColumnExpression } from '../../common/sql-expression-utils';
import {
	buildComparisonQueryConfig,
	buildBenchmarkDimensionColumns
} from '../../common/build-comparisons';
import type { ResolvedComparison } from '../../common/comparison-schema';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';

export interface DeltaSQLAttrs extends BaseSQLAttrs {
	value: string;
	/** Already-resolved (variable interpolation + selector parsing done upstream). */
	comparison?: Partial<ResolvedComparison>;
	dialect?: SqlDialect;
}

export function buildDeltaSQLConfig(attrs: DeltaSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);

	const comparisonConfig = buildComparisonQueryConfig(
		attrs.comparison,
		valueProcessed,
		attrs.date_range
	);

	const columns = [valueProcessed, ...buildBenchmarkDimensionColumns(attrs.comparison, dialect)];

	return {
		tableExpressionName: attrs.data,
		columns,
		filterIds: attrs.filters ?? [],
		date_range: attrs.date_range,
		comparisons: comparisonConfig ? [comparisonConfig] : [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order: attrs.order,
		limit: attrs.limit ?? 1
	};
}

export function buildDeltaSQL(attrs: DeltaSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildDeltaSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
