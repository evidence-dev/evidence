import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import { processColumnExpression } from '../../common/sql-expression-utils';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';

export interface ImageSQLAttrs extends Omit<BaseSQLAttrs, 'having'> {
	column: string;
	dark_column?: string;
	description_column?: string;
	dialect?: SqlDialect;
}

export function buildImageSQLConfig(attrs: ImageSQLAttrs): SQLQueryConfig {
	const dialect = attrs.dialect ?? defaultDialect;

	const columns = [attrs.column, attrs.dark_column, attrs.description_column]
		.filter((col): col is string => Boolean(col))
		.map((col) => processColumnExpression({ value: col }, dialect));

	return {
		tableExpressionName: attrs.data,
		columns,
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		qualify: attrs.qualify,
		order: attrs.order,
		limit: attrs.limit ?? 1,
		// A row lookup, not an aggregation: grouping would discard the source
		// query's ORDER BY and make "first row" nondeterministic.
		skipGroupBy: true
	};
}

export function buildImageSQL(attrs: ImageSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	const config = buildImageSQLConfig(attrs);
	return generateSQLQuery(config, undefined, undefined, attrs.anchorDate, firstDayOfWeek, dialect);
}
