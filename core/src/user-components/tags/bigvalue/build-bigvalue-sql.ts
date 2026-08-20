import {
	generateSQLQuery,
	generateSparklineId,
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
import type { DateRangeObject } from '../../common/date-options';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';

export interface BigValueSparklineAttrs {
	type?: string;
	x?: string;
	date_range?: DateRangeObject;
	date_grain?: string;
}

export interface BigValueSQLAttrs extends BaseSQLAttrs {
	value: string;
	/** Already-resolved (variable interpolation + selector parsing done upstream). */
	comparison?: Partial<ResolvedComparison>;
	sparkline?: BigValueSparklineAttrs;
	dialect?: SqlDialect;
}

export function buildBigValueSQLConfig(attrs: BigValueSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;
	const valueProcessed = processColumnExpression({ value: attrs.value }, dialect);

	const comparisonConfig = buildComparisonQueryConfig(
		attrs.comparison,
		valueProcessed,
		attrs.date_range
	);

	let sparklineConfig: {
		id: string;
		xColumn: string;
		yColumn: string;
		type: 'line' | 'area' | 'bar';
		date_range: DateRangeObject | undefined;
		date_grain: string | undefined;
	} | null = null;
	if (attrs.sparkline) {
		const xColumn = attrs.sparkline.x ?? attrs.sparkline.date_range?.date ?? attrs.date_range?.date;
		if (xColumn) {
			sparklineConfig = {
				id: generateSparklineId(valueProcessed.alias),
				xColumn,
				yColumn: valueProcessed.sqlWithoutAlias,
				type: (attrs.sparkline.type ?? 'line') as 'line' | 'area' | 'bar',
				date_range: attrs.sparkline.date_range ?? attrs.date_range,
				date_grain: attrs.sparkline.date_grain
			};
		}
	}

	const columns = [valueProcessed, ...buildBenchmarkDimensionColumns(attrs.comparison, dialect)];

	return {
		tableExpressionName: attrs.data,
		columns,
		filterIds: attrs.filters ?? [],
		date_range: attrs.date_range,
		comparisons: comparisonConfig ? [comparisonConfig] : [],
		sparklines: sparklineConfig ? [sparklineConfig] : [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order: attrs.order,
		limit: 1
	};
}

export function buildBigValueSQL(attrs: BigValueSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	const config = buildBigValueSQLConfig(attrs);
	return generateSQLQuery(config, undefined, undefined, attrs.anchorDate, firstDayOfWeek, dialect);
}
