import type { EChartsOption } from 'echarts';
import merge from 'lodash/merge';
import type { UserComponentAttribute } from '../types';
import { ZodAttribute } from './zod-attribute';
import { setZodMetadata } from './zod-metadata';
import { z } from 'zod';

/**
 * Raw ECharts escape hatches for standalone (single-series) charts —
 * radar, treemap, chord, and similar. Spread both into a schema's
 * `attributes` and deep-merge them in the component:
 *
 *   options = merge({}, computedOptions, props.echarts_options ?? {})
 *   // and merge props.echarts_series_options into each series entry
 *
 * The series-chart family (line/bar/area/…) has its own per-series
 * variant; these are the chart-wide equivalents for charts with a single
 * `series` array.
 */
export const ECHARTS_OPTIONS_ATTRIBUTE = {
	echarts_options: {
		type: ZodAttribute.create(
			setZodMetadata(z.record(z.unknown()).optional(), {
				blockExample: `\`\`\`
echarts_options={
    tooltip={ position="top" }
    graphic=[{ type="text" }]
}
\`\`\``
			})
		),
		required: false,
		description:
			"Raw [ECharts options](https://echarts.apache.org/en/option.html) deep-merged over the chart's final configuration. Use for anything the structured props do not expose — `graphic`, `visualMap`, tooltip styling, and so on. Partial overrides win key-by-key without clobbering Studio's computed siblings. For overrides scoped to the data series, use `echarts_series_options`.",
		affectsQuery: false
	}
} as const satisfies Record<string, UserComponentAttribute>;

export const ECHARTS_SERIES_OPTIONS_ATTRIBUTE = {
	echarts_series_options: {
		type: ZodAttribute.create(
			setZodMetadata(z.record(z.unknown()).optional(), {
				blockExample: `\`\`\`
echarts_series_options={
    itemStyle={ borderRadius=8 }
}
\`\`\``
			})
		),
		required: false,
		description:
			'Raw [ECharts series options](https://echarts.apache.org/en/option.html#series) deep-merged into the chart series. Use for series-level styling the structured props do not expose.',
		affectsQuery: false
	}
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * Deep-merge the author's raw ECharts escape hatches over a chart's
 * computed options. `echarts_series_options` merges into every entry of
 * the `series` array first; then `echarts_options` merges over the whole
 * config, so a raw override always wins last (matching the combo-chart
 * merge order). Returns a fresh object — inputs are not mutated.
 */
export function mergeEchartsOptions(
	baseOptions: EChartsOption,
	overrides: {
		echarts_options?: Record<string, unknown>;
		echarts_series_options?: Record<string, unknown>;
	}
): EChartsOption {
	const seriesOverrides = overrides.echarts_series_options;
	const withSeries =
		seriesOverrides && Array.isArray(baseOptions.series)
			? {
					...baseOptions,
					series: baseOptions.series.map((s) => merge({}, s, seriesOverrides))
				}
			: baseOptions;

	return merge({}, withSeries, overrides.echarts_options ?? {});
}
