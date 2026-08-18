import {
	generateSQLQuery,
	type BaseSQLAttrs,
	type SQLQueryConfig,
	type SQLQueryResult
} from '../../common/sql-options';
import type { SqlDialect } from '../../../sql-dialect';
import { defaultDialect } from '../../../sql-dialect';

export interface CustomEchartSQLAttrs extends BaseSQLAttrs {
	dialect?: SqlDialect;
}

export function buildCustomEchartSQLConfig(attrs: CustomEchartSQLAttrs): SQLQueryConfig {
	return {
		tableExpressionName: attrs.data,
		// SELECT * — the user's echarts config can reference any column via dataset encode
		columns: [],
		filterIds: attrs.filters ?? [],
		where: attrs.where,
		having: attrs.having,
		qualify: attrs.qualify,
		order: attrs.order,
		limit: attrs.limit,
		date_range: attrs.date_range
	};
}

export function buildCustomEchartSQL(attrs: CustomEchartSQLAttrs): SQLQueryResult {
	const firstDayOfWeek = attrs.firstDayOfWeek ?? 'sunday';
	const dialect = attrs.dialect ?? defaultDialect;
	return generateSQLQuery(
		buildCustomEchartSQLConfig(attrs),
		undefined,
		undefined,
		attrs.anchorDate,
		firstDayOfWeek,
		dialect
	);
}
