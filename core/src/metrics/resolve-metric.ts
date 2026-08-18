import { compileMetric, metricExpression } from './compile-metric';
import type { MetricsCatalog } from './metrics-catalog';
import type { Metric, MetricsView } from './metric-schema';
import type { SQLQueryConfig } from '../user-components/common/sql-options';
import formatTitle from '../user-components/formatTitle';
import type { SqlDialect } from '../sql-dialect';

/**
 * The human display name for a metric: its explicit `label`, else its name
 * humanized the same way SQL column aliases are (`order_count` → "Order Count").
 * The single source of truth for metric labelling so every component — big_value,
 * line_chart, and future ones — labels a metric identically.
 */
export function metricDisplayLabel(metric: Pick<Metric, 'name' | 'label'>): string {
	return metric.label ?? formatTitle(metric.name);
}

export type ResolvedMetric = {
	/** The metric's canonical name (its column alias in the result). */
	name: string;
	/** Declared display label, if any. */
	label: string | undefined;
	/**
	 * Display label components use by default: the explicit `label`, else the
	 * metric name prettified the same way column aliases are (`order_count` →
	 * "Order Count", `aov` → "AOV").
	 */
	displayLabel: string;
	/**
	 * Resolve a `category=`/`series=`/`x=` value against the metric view's named
	 * dimensions: a bare `dimensions:` name becomes its `source` expression,
	 * anything else passes through unchanged. Every metric-consuming component
	 * (pie/funnel/treemap/table/…) should route its dimension-column attrs
	 * through this so `category="product"` maps to `product_line` when the view
	 * declares `dimensions: { product: product_line }` — otherwise the raw name
	 * hits the warehouse as an unknown column.
	 */
	resolveDimension: (value: string | undefined) => string | undefined;
	/** Base relation to query — the view's `base`, or its `base_sql` wrapped. */
	base: string;
	/**
	 * The aggregate SQL expression (per-metric filter folded in, `{name}` refs
	 * expanded). Components feed this as a `value=`/`y=` into their existing SQL
	 * builders so the metric composes with component `filters`/`date_range`/etc.
	 */
	valueExpression: string | undefined;
	/** Compiled query for a single-number read of the metric, or undefined on error. */
	queryConfig: SQLQueryConfig | undefined;
	/** Declared display format per metric name, for the component to apply. */
	columnFormats: Record<string, string>;
	/**
	 * The metric's time column (`metric.date ?? view.date`). Callers that render
	 * a time series compare their `x` against this to decide whether the view's
	 * default grain should apply — same rule `resolveMetricChart` uses to avoid
	 * date-truncating a categorical x.
	 */
	viewDate: string | undefined;
	/**
	 * View-level default `grain` (`month`/`week`/...). Chart children in metric
	 * mode fall back to this so `revenue` charted against its time column buckets
	 * at the same grain the semantic layer declares, matching top-level
	 * `line_chart metric="..."` behaviour.
	 */
	viewGrain: string | undefined;
};

/**
 * Resolve a `metric="..."` reference to a compiled query, shared by every
 * component that accepts `metric=` (big_value today; charts/tables next) so the
 * lookup + compile lives in ONE place, not copy-pasted per component.
 *
 * Returns undefined when there's no reference or it doesn't resolve. Errors are
 * intentionally NOT surfaced here — a bad reference is caught at edit time by the
 * `metricExists` validator (Monaco squiggle), matching how `tableExists` /
 * `validateSqlExpression` behave for every other component. Downstream this just
 * yields no query (blank), consistent with any other unresolved reference.
 */
export function resolveMetric(
	catalog: MetricsCatalog | undefined,
	name: string | unknown[] | undefined,
	dialect: SqlDialect
): ResolvedMetric | undefined {
	// Scalar components (big_value/value/delta/sparkline/etc.) show ONE number,
	// so if an array slipped through the schema they get the first element.
	// Length > 1 for a scalar is undefined behavior in v1 — the metricExists
	// validator flags this shape mismatch at edit time.
	const names = normalizeMetricAttr(name);
	if (names.length === 0) return undefined;
	const found = catalog?.getMetric(names[0]);
	if (!found) return undefined;
	const { queryConfig, columnFormats } = compileMetric(
		found.view,
		{ metrics: [found.metric.name] },
		dialect
	);
	const { expr } = metricExpression(found.view, found.metric.name, dialect);
	const base =
		found.view.base ?? `(${found.view.baseSql}) ${dialect.quoteAlias('__ev_metric_base')}`;
	return {
		name: found.metric.name,
		label: found.metric.label,
		displayLabel: metricDisplayLabel(found.metric),
		resolveDimension: (value) => resolveViewDimension(found.view, value),
		base,
		valueExpression: expr,
		queryConfig,
		columnFormats,
		viewDate: found.metric.date ?? found.view.date,
		viewGrain: found.view.defaultDateGrain
	};
}

export type MetricChartProps = {
	/** Base relation to query (the metric view's `base`, or its `base_sql` wrapped). */
	data: string;
	/** x-axis SQL: a resolved named dimension, an explicit override, or the view's time column. */
	x: string | undefined;
	/** series SQL: a resolved named dimension or explicit override; undefined if none. */
	series: string | undefined;
	/** Default grain from the view, applied to `x` unless the component overrides. */
	dateGrain: string | undefined;
	/** One aliased aggregate per metric (`sum(amount) AS revenue`) → one series each. */
	y: string[];
	/** Legend label per `y`, positionally aligned. Kept separate from the SQL alias
	 * (the raw metric name, so `order=`/refs resolve) rather than baked into it. */
	yLabels: string[];
	/** Shared display format when all requested metrics agree on one, else undefined. */
	yFmt: string | undefined;
};

/** Chart attribute overrides that resolve against the metric view before falling back to defaults. */
export type MetricChartOverrides = { x?: string; series?: string };

/** Minimal shape of the props a MultiSeries wrapper chart (line/bar/area) passes down. */
type MetricChartInputProps = {
	metric?: string | unknown[] | undefined;
	data?: string | undefined;
	x?: string | undefined;
	series?: string | undefined;
	date_grain?: string | undefined;
	y?: string | unknown[] | undefined;
	y_labels?: string[] | undefined;
	y_fmt?: string | undefined;
};

/**
 * Normalize `metric=` to a list of metric names. Accepts a single string or an
 * array of strings — mirroring the `y` attribute's `[String, Array]` shape.
 * A comma-separated string (`"revenue, orders"`) is REJECTED here rather than
 * silently split: it's undocumented, would collide with metric names containing
 * commas, and the array form is unambiguous and consistent with sibling attrs.
 * The caller (metricExists validator) surfaces the fix hint at edit time.
 */
export function normalizeMetricAttr(value: string | unknown[] | undefined): string[] {
	if (value === undefined || value === null) return [];
	if (Array.isArray(value)) {
		return value
			.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
			.map((v) => v.trim());
	}
	if (typeof value !== 'string') return [];
	const trimmed = value.trim();
	if (trimmed === '') return [];
	// Reject the comma-split shape — caller-side validation should have caught it,
	// but bail here too so we don't silently split "foo, bar" as two metric names.
	if (trimmed.includes(',')) return [];
	return [trimmed];
}

/**
 * Merge a metric reference into the raw `data`/`x`/`series`/`date_grain`/`y`/
 * `y_fmt` a chart already understands, so line/bar/area share one code path.
 * Explicit attributes win; non-metric usage passes props through unchanged.
 */
export function applyMetricChartProps<P extends Record<string, unknown>>(
	props: P,
	catalog: MetricsCatalog | undefined,
	dialect: SqlDialect
): P {
	const p = props as MetricChartInputProps;
	if (!p.metric) return props;
	const resolved = resolveMetricChart(catalog, p.metric, dialect, { x: p.x, series: p.series });
	if (!resolved) return props;
	return {
		...props,
		data: p.data ?? resolved.data,
		x: resolved.x,
		series: resolved.series,
		date_grain: p.date_grain ?? resolved.dateGrain,
		y: p.y ?? resolved.y,
		// Author-overridden `y=` keeps its own aliases; only label metric-supplied y.
		y_labels: p.y ? p.y_labels : resolved.yLabels,
		y_fmt: p.y_fmt ?? resolved.yFmt
	} as P;
}

/**
 * Wrap a component's dimension-attr resolution (category, series, source,
 * target, x, y — whatever the chart type uses to slice by) with metric-view
 * dimension mapping when the component is in metric mode. In raw mode
 * (metric undefined) or when no value is set, passes through unchanged.
 * One-liner helper so each metric-consuming component stays a single-line
 * edit rather than a repeated ternary.
 */
export function applyMetricDimension<T extends string | undefined>(
	metric: ResolvedMetric | undefined,
	value: T
): T {
	if (!metric || !value) return value;
	// resolveDimension either returns a mapped source or the pass-through value;
	// preserve the caller's narrower type (string vs string|undefined) so
	// downstream `processColumnExpression({ value })` inputs still typecheck.
	return (metric.resolveDimension(value) ?? value) as T;
}

/**
 * Resolve a chart axis/series value against a metric view's named dimensions:
 * a bare `dimensions:` name becomes its `source` expression; anything else
 * (raw SQL, a real column) passes through unchanged.
 */
function resolveViewDimension(view: MetricsView, value: string | undefined): string | undefined {
	if (!value) return undefined;
	const dim = view.dimensions.find((d) => d.name === value);
	return dim?.source ?? value;
}

/**
 * Resolve a chart's `metric=` (single string or array) into the raw `data` /
 * `x` / `date_grain` / `y[]` a time-series chart already understands, so
 * `metric=` reduces to the existing chart SQL pipeline (no changes to
 * ComboChart/SeriesModel).
 *
 *  - `data` and the default `x` (the view's time column) come from the metric's
 *    view; the caller lets an explicit `x=` / `date_grain=` / `data=` override.
 *  - `y` is one aliased aggregate per metric, so multiple metrics fan out into
 *    multiple series via the existing MultiSeries loop.
 *
 * v1 is single-view: only metrics that share the first metric's base are
 * included (cross-base composition needs joins/align, deferred). Returns
 * undefined when nothing resolves — the caller falls back to raw props, and the
 * `metricExists` validator surfaces the bad reference at edit time.
 */
export function resolveMetricChart(
	catalog: MetricsCatalog | undefined,
	metric: string | unknown[] | undefined,
	dialect: SqlDialect,
	overrides: MetricChartOverrides = {}
): MetricChartProps | undefined {
	const names = normalizeMetricAttr(metric);
	if (names.length === 0) return undefined;

	const first = catalog?.getMetric(names[0]);
	if (!first) return undefined;
	const view = first.view;

	const y: string[] = [];
	const yLabels: string[] = [];
	const formats: (string | undefined)[] = [];
	for (const name of names) {
		const found = catalog?.getMetric(name);
		if (!found) {
			// An unresolvable name in the middle of an array previously fell through
			// silently; the chart quietly plotted the survivors. That's a data-integrity
			// footgun — return undefined so the component renders nothing rather than
			// misleadingly showing a partial answer. `metricExists` surfaces the ref
			// error at edit time.
			return undefined;
		}
		// v1: every series shares one base, so a query at one grain is fan-out-safe.
		// Mismatched bases used to be silently skipped (partial-answer footgun);
		// bail out entirely so the chart doesn't quietly render only the survivors.
		// The `metricExists` cross-base check surfaces this at edit time.
		if (found.view.base !== view.base || found.view.baseSql !== view.baseSql) {
			return undefined;
		}
		const { expr, error } = metricExpression(found.view, found.metric.name, dialect);
		if (error || !expr) return undefined;
		// Alias by the raw metric name (matching the tabular path) so `order=`/refs
		// resolve; the humanized legend label is carried separately in `yLabels`.
		y.push(`${expr} AS ${dialect.quoteAlias(found.metric.name)}`);
		yLabels.push(metricDisplayLabel(found.metric));
		formats.push(found.metric.fmt);
	}
	if (y.length === 0) return undefined;

	// A shared y-axis format only makes sense when every series agrees on one
	// (e.g. usd + a count must NOT force the count into usd).
	const yFmt = formats[0] && formats.every((f) => f === formats[0]) ? formats[0] : undefined;

	const data = view.base ?? `(${view.baseSql}) ${dialect.quoteAlias('__ev_metric_base')}`;
	// x: explicit override (resolved against dimensions) → else the view's time column.
	const timeColumn = first.metric.date ?? view.date;
	const x = overrides.x ? resolveViewDimension(view, overrides.x) : timeColumn;
	// The view's default grain buckets the TIME axis only. If the author points x
	// at a non-time dimension (e.g. `x="category"`), defaulting the grain would
	// date-truncate it (`toStartOfMonth(category)`) and emit nonsense — so only
	// default the grain when x actually is the view's time column. An explicit
	// `date_grain=` on the component still wins (the caller merges it over this).
	const isTimeAxis = x !== undefined && x === timeColumn;
	return {
		data,
		x,
		series: resolveViewDimension(view, overrides.series),
		dateGrain: isTimeAxis ? view.defaultDateGrain : undefined,
		y,
		yLabels,
		yFmt
	};
}
