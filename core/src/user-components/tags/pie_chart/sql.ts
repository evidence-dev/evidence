import type { ComponentSql, ComponentSqlEnv } from '../../component-sql';
import type { UserComponentProps } from '../../types';
import type { SQLProps, SQLQueryConfig } from '../../common/sql-options';
import { extractSQLProps } from '../../common/sql-options';
import { resolveTooltipFields, type TooltipField } from '../../common/tooltip-fields';
import { resolveMetric, applyMetricDimension } from '../../../metrics/resolve-metric';
import { buildPieChartSQLConfig } from './build-pie-chart-sql';
import type { schema } from './schema';

export type PieChartSqlProps = UserComponentProps<typeof schema> & SQLProps;

/** The resolved attributes the query is built from; the component reuses them for display. */
export function resolvePieChartSqlInputs(props: PieChartSqlProps, env: ComponentSqlEnv) {
	const { resolveText, resolveColumn, resolveSql } = env.resolvers;
	// `metric="revenue"` supplies base + aggregate SQL + format; category flows
	// through unchanged (there's no view-level default slice dimension in v1).
	const resolvedMetric = resolveText(props.metric);
	const metricCompiled = resolveMetric(env.metricsCatalog, resolvedMetric, env.dialect);
	const tableName = resolveText(props.data) ?? metricCompiled?.base;
	// In metric mode, resolve dimension attrs against the view's named
	// dimensions — `category="product"` → `product_line` when the view
	// declares `dimensions: { product: product_line }`. Raw columns pass
	// through unchanged. `applyMetricDimension` is a no-op in raw mode.
	const category = applyMetricDimension(metricCompiled, resolveColumn(props.category));
	const value = resolveColumn(props.value) ?? metricCompiled?.valueExpression ?? '';
	const where = resolveSql(props.where);
	const having = resolveSql(props.having);
	const order = resolveSql(props.order);
	const qualify = resolveSql(props.qualify);
	const dateRange = resolveText(props.date_range);
	const tooltip = resolveTooltipFields(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined,
		env.dialect
	);
	return {
		metricCompiled,
		tableName,
		category,
		value,
		where,
		having,
		order,
		qualify,
		dateRange,
		tooltip
	};
}

export const pieChartSql: ComponentSql<PieChartSqlProps, undefined, SQLQueryConfig> = {
	queries(props, env) {
		const { limit } = extractSQLProps(props);
		const inputs = resolvePieChartSqlInputs(props, env);
		if (!inputs.tableName) return [];
		return [
			{
				role: 'data',
				config: buildPieChartSQLConfig({
					data: inputs.tableName,
					category: inputs.category,
					value: inputs.value,
					filters: props.filters,
					where: inputs.where,
					date_range: inputs.dateRange,
					having: inputs.having,
					qualify: inputs.qualify,
					order: inputs.order,
					limit,
					dialect: env.dialect,
					tooltipFieldColumns: inputs.tooltip.columns
				})
			}
		];
	}
};
