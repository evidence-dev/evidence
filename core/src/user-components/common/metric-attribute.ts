import type { UserComponentSchema } from '../types';

/**
 * Scalar `metric=` for components that show ONE metric (big_value, pie,
 * funnel, table's measure child, every non-multi-series component). Enforcing
 * `type: String` at the schema level means Markdoc rejects an array shape
 * up front — otherwise these components would silently take the first
 * element of `metric=[a,b]` and drop the rest.
 */
export const METRIC_ATTRIBUTE = {
	metric: {
		type: String,
		required: false,
		suggestionType: 'metric',
		description:
			'Semantic metric name to display, from metrics/*.yaml. Use instead of the raw data/value/x/y attributes.',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	}
} as const satisfies UserComponentSchema['attributes'];

/**
 * Multi-series `metric=` for MultiSeries wrappers (line_chart, bar_chart,
 * area_chart) that can fan out across a metric ARRAY into one series per
 * metric. Accepts a single string OR an array — the compiler normalises via
 * `normalizeMetricAttr`.
 */
export const METRIC_ARRAY_ATTRIBUTE = {
	metric: {
		// Mirrors the `y` attr on MultiSeries: a single string for one metric,
		// or an array of strings for multiple series (one series per metric).
		type: [String, Array],
		required: false,
		suggestionType: 'metric',
		description:
			'Semantic metric name(s) to display, from metrics/*.yaml. Use instead of the raw data/value/x/y attributes. Pass an array for multiple series (e.g. `metric=["revenue", "orders"]`).',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	}
} as const satisfies UserComponentSchema['attributes'];
