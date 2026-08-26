/**
 * Shared `metric=` support for the MultiSeries wrapper charts (line/bar/area).
 * Only the `notMetric` predicate remains — it gates raw-only validators via
 * `ifCondition(notMetric, ...)`. The metric-XOR-raw check moved to the
 * declarative `dataSources` on each chart schema (see `common/data-sources.ts`).
 */

/** True when the chart is NOT in metric mode (uses the raw data/x/y path). */
export const notMetric = (node: { attributes?: Record<string, unknown> }): boolean =>
	!node.attributes?.metric;

/** True when the chart IS in metric mode (`metric=` supplies data + y). */
export const isMetric = (node: { attributes?: Record<string, unknown> }): boolean =>
	!!node.attributes?.metric;
