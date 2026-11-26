import type { ComponentSql, ComponentSqlEnv } from '../../component-sql';
import type { UserComponentProps } from '../../types';
import type { SQLQueryConfig } from '../../common/sql-options';
import { extractSQLProps } from '../../common/sql-options';
import { resolveComparisonFromSelector } from '../../common/parse-comparison-selector';
import { resolveMetric } from '../../../metrics/resolve-metric';
import { buildBigValueSQLConfig } from './build-bigvalue-sql';
import type { schema } from './schema';

export type BigValueSqlProps = UserComponentProps<typeof schema>;

/** The resolved attributes the query is built from; the model reuses them for display. */
export function resolveBigValueSqlInputs(attributes: BigValueSqlProps, env: ComponentSqlEnv) {
	const { resolveText, resolveColumn, resolveSql } = env.resolvers;
	const data = resolveText(attributes.data);
	const value = resolveColumn(attributes.value);
	const metric = resolveText(attributes.metric);

	// `metric="revenue"` is the whole reference — a metric is a single number, so
	// no `value=`. Resolution (catalog lookup + compile) lives in the shared
	// `resolveMetric` helper so every `metric=`-capable component reuses it. A bad
	// reference is caught at edit time by the `metricExists` validator, exactly
	// like `tableExists` for `data=` — so there's no bespoke runtime error here.
	const metricCompiled = resolveMetric(env.metricsCatalog, metric, env.dialect);

	const where = resolveSql(attributes.where);

	// Process entire date_range object - recursively handles all string properties
	const dateRange = attributes.date_range ? resolveText(attributes.date_range) : undefined;

	const comparison = (() => {
		if (!attributes.comparison) {
			return undefined;
		}

		// Process variables in compare_vs (might be a selector reference like "{{comp}}")
		const processedCompareVs = resolveText(attributes.comparison.compare_vs);

		// Build comparison with resolved compare_vs, keeping original types
		const processedComparison = {
			...attributes.comparison,
			compare_vs: processedCompareVs
		};

		// Then resolve selector config if compare_vs contains a JSON config
		return resolveComparisonFromSelector(processedComparison);
	})();

	const sparkline = (() => {
		if (!attributes.sparkline) return undefined;
		const sparkline = resolveText(attributes.sparkline);
		// Metric mode: default the sparkline's time axis to the view's date/grain
		// (still overrideable) — mirrors resolveMetricChart. Grain only applies when
		// x IS the view's date, never forced onto a non-temporal x.
		if (!metricCompiled?.valueExpression) return sparkline;
		const x =
			sparkline.x ?? sparkline.date_range?.date ?? dateRange?.date ?? metricCompiled.viewDate;
		const date_grain =
			sparkline.date_grain ??
			(x && x === metricCompiled.viewDate ? metricCompiled.viewGrain : undefined);
		return { ...sparkline, x, date_grain };
	})();

	return { data, value, metric, metricCompiled, where, dateRange, comparison, sparkline };
}

export const bigValueSql: ComponentSql<BigValueSqlProps, undefined, SQLQueryConfig> = {
	queries(attributes, env) {
		const inputs = resolveBigValueSqlInputs(attributes, env);
		const sqlProps = extractSQLProps(attributes);

		// Metric path: the metric supplies the base table + aggregate expression,
		// but everything else flows through the SAME builder as the raw path — so
		// component `filters`/`date_range`/`where`/`comparison`/`sparkline` all
		// apply, and the metric's declared filter/format/label are respected.
		const metric = inputs.metricCompiled;
		if (metric?.valueExpression) {
			return [
				{
					role: 'data',
					config: buildBigValueSQLConfig({
						data: metric.base,
						value: metric.valueExpression,
						where: inputs.where,
						having: sqlProps.having,
						qualify: sqlProps.qualify,
						order: sqlProps.order,
						date_range: inputs.dateRange,
						comparison: inputs.comparison,
						sparkline: inputs.sparkline,
						filters: attributes.filters,
						dialect: env.dialect
					})
				}
			];
		}
		// `metric=` set but unresolved → no query (edit-time validation flags it);
		// never fall through to the raw path.
		if (inputs.metric) return [];

		// Raw data path needs both a data source and a value expression; validation
		// enforces this, but guard so the derivation never passes undefined through.
		const data = inputs.data;
		const value = inputs.value;
		if (!data || !value) return [];

		return [
			{
				role: 'data',
				config: buildBigValueSQLConfig({
					data,
					value,
					where: inputs.where,
					having: sqlProps.having,
					qualify: sqlProps.qualify,
					order: sqlProps.order,
					date_range: inputs.dateRange,
					comparison: inputs.comparison,
					sparkline: inputs.sparkline,
					filters: attributes.filters,
					dialect: env.dialect
				})
			}
		];
	}
};
