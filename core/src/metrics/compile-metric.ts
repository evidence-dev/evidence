import {
	processColumnExpression,
	applyAggregateFilter
} from '../user-components/common/sql-expression-utils';
import { type SQLQueryConfig } from '../user-components/common/sql-options';
import { defaultDialect, type SqlDialect } from '../sql-dialect';
import { extractMetricRefs, metricRefRegex, type Metric, type MetricsView } from './metric-schema';

/**
 * Compiles a selection of metrics (+ optional dimensions) from ONE metrics view
 * into a `SQLQueryConfig` consumed by the EXISTING `generateSQLQuery`. The metric
 * layer is pure name→expression resolution over the query builder — not a new
 * engine. Only the requested dimensions enter SELECT/GROUP BY, so the query is
 * built at exactly the requested grain (no over-grouping → no wrong numbers).
 * Per-metric filters are pushed INTO the aggregate via the shared
 * `applyAggregateFilter` (FILTER on ClickHouse, CASE WHEN elsewhere).
 *
 * Calculated (derived) metrics compose others via `{name}` references, expanded
 * inline here (`{revenue} / {orders}` → `(sum(..)) / (count(*))`). Because every
 * metric in a view aggregates the SAME base rows at the SAME grain, inlining is
 * always correct — no re-aggregation, so no additivity hazard. Cross-view
 * references are rejected (they need join/align, deferred).
 *
 * v1 is single-view: dimensions sourced from a join are rejected (join execution
 * is deferred), so every compiled query is fan-out-safe by construction.
 */

/**
 * Resolve a metric to its SQL aggregate expression, expanding any `{name}`
 * references to other metrics in the same view. `seen` carries the reference
 * chain for cycle detection. A fresh regex per call avoids the stateful-lastIndex
 * bug when this recurses inside the `.replace` callback.
 */
function resolveMetricExpression(
	metric: Metric,
	metricByName: Map<string, Metric>,
	dialect: SqlDialect,
	seen: string[]
): { expr: string; error?: string } {
	const refs = extractMetricRefs(metric.sql);
	if (refs.length === 0) {
		// Plain aggregate: push its filter INTO the aggregate so divergent-filter
		// metrics still compose in one query at one grain.
		const expr = metric.filter
			? applyAggregateFilter(metric.sql, `(${metric.filter})`, dialect)
			: metric.sql;
		return { expr };
	}
	if (metric.filter) {
		return {
			expr: '',
			error: `Metric "${metric.name}": \`filter\` is only supported on simple metrics — filter the metrics it references instead.`
		};
	}
	if (seen.includes(metric.name)) {
		return {
			expr: '',
			error: `Circular metric reference: ${[...seen, metric.name].join(' → ')}.`
		};
	}
	let error: string | undefined;
	const expr = metric.sql.replace(metricRefRegex(), (_full, ref: string) => {
		if (error) return '';
		const refMetric = metricByName.get(ref);
		if (!refMetric) {
			error = `Metric "${metric.name}" references "${ref}", which is not a metric in this view (cross-view references are not yet supported).`;
			return '';
		}
		const resolved = resolveMetricExpression(refMetric, metricByName, dialect, [
			...seen,
			metric.name
		]);
		if (resolved.error) {
			error = resolved.error;
			return '';
		}
		return `(${resolved.expr})`;
	});
	return error ? { expr: '', error } : { expr };
}

export type CompileMetricRequest = {
	metrics: string[];
	dimensions?: string[];
};

export type CompiledMetric = {
	queryConfig?: SQLQueryConfig;
	/** Display format per metric name (e.g. `sales` → `usd`) for the consumer to apply. */
	columnFormats: Record<string, string>;
	errors: string[];
};

export function compileMetric(
	view: MetricsView,
	request: CompileMetricRequest,
	dialect: SqlDialect = defaultDialect
): CompiledMetric {
	const errors: string[] = [];
	const columnFormats: Record<string, string> = {};
	const dimByName = new Map(view.dimensions.map((d) => [d.name, d]));
	const metricByName = new Map(view.metrics.map((m) => [m.name, m]));

	const columns = [];
	const requestedDimensions = request.dimensions ?? [];

	for (const name of requestedDimensions) {
		const dim = dimByName.get(name);
		if (!dim) {
			errors.push(`Unknown dimension: ${name}`);
			continue;
		}
		columns.push(
			processColumnExpression({ value: `${dim.source} AS ${dim.name}`, type: 'dimension' }, dialect)
		);
	}

	for (const name of request.metrics) {
		const metric = metricByName.get(name);
		if (!metric) {
			errors.push(`Unknown metric: ${name}`);
			continue;
		}
		const { expr, error } = resolveMetricExpression(metric, metricByName, dialect, []);
		if (error) {
			errors.push(error);
			continue;
		}
		columns.push(
			processColumnExpression({ value: `${expr} AS ${metric.name}`, type: 'measure' }, dialect)
		);
		if (metric.fmt) columnFormats[metric.name] = metric.fmt;
	}

	if (errors.length > 0) return { columnFormats, errors };

	const tableExpressionName =
		view.base ?? `(${view.baseSql}) ${dialect.quoteAlias('__ev_metric_base')}`;

	const queryConfig: SQLQueryConfig = {
		tableExpressionName,
		columns,
		hasDimensions: requestedDimensions.length > 0,
		hasMeasures: request.metrics.length > 0
	};

	return { queryConfig, columnFormats, errors: [] };
}

/**
 * Resolve a single metric to its aggregate SQL expression (with `{name}` refs
 * expanded and any per-metric filter folded in). Used by time-series charts,
 * which feed the expression as a `y=` into the existing chart SQL builder rather
 * than the scalar `queryConfig`.
 */
export function metricExpression(
	view: MetricsView,
	metricName: string,
	dialect: SqlDialect = defaultDialect
): { expr?: string; error?: string } {
	const metricByName = new Map(view.metrics.map((m) => [m.name, m]));
	const metric = metricByName.get(metricName);
	if (!metric) return { error: `Unknown metric: ${metricName}` };
	const { expr, error } = resolveMetricExpression(metric, metricByName, dialect, []);
	return error ? { error } : { expr };
}
