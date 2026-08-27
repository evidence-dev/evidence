import type { UserComponentSchema } from '../../../types';
import { DATE_RANGE_ATTRIBUTE, DATE_GRAIN_ATTRIBUTE } from '../../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../../common/sql-options';
import { TITLE_ATTRIBUTES } from '../../../common/title-attributes';
import {
	and,
	axisHasAggregation,
	filtersExist,
	tableExists,
	validateSqlExpression,
	validateDateAttributes,
	validateDateRange,
	validateSqlOptions,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	validateAxisMinMax
} from '../../../validators';
import { WIDTH_ATTRIBUTE } from '../../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../../common/height-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../../common/connect-group-attribute';
import { hasChild } from '../../../validators/hasChild';
import { isValidationContext } from '../../../validators/types';
import type { Node } from '@markdoc/markdoc';
import { ZodAttribute } from '../../../common/zod-attribute';
import { xAxisOptionsSchema } from './x-axis-options-schema';
import { yAxisOptionsSchema } from './y-axis-options-schema';
import { z } from 'zod';
import { HANDLE_MISSING_ATTRIBUTE } from '../../../common/handle-missing-attribute';
import { colorPaletteSchema, seriesColorsSchema } from '../../../common/chart-options-schema';
import { setZodMetadata } from '../../../common/zod-metadata';

import { CROSS_FILTER_ATTRIBUTES } from '../../../common/cross-filter-attributes';

const attributes = {
	data: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold as the default authoring pattern; not
		// required because a combo_chart whose children are ALL metric-driven
		// derives its data per-child from each metric's base (see the child-mix
		// validator below).
		suggested: true,
		description:
			'Name of the table to query. Required unless every child series uses `metric="..."` — metric children resolve their own base from the metric view.',
		suggestionType: 'table',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...CROSS_FILTER_ATTRIBUTES,
	...DATE_RANGE_ATTRIBUTE,
	...DATE_GRAIN_ATTRIBUTE,
	...HANDLE_MISSING_ATTRIBUTE,
	x: {
		type: String,
		// Not strictly required: a combo_chart whose children are ALL metric-driven
		// inherits the x-axis from each metric view's time column. The cross-child
		// validator below still errors when any child is raw AND `x` is missing.
		required: false,
		suggested: true,
		description:
			'Column name for x-axis. Required unless every child series uses `metric="..."` — metric children fall back to the metric view\'s time column.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	x_fmt: {
		type: String,
		required: false,
		description: 'Format for x values and axis labels',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	y_fmt: {
		type: String,
		required: false,
		description: 'Format for y values and axis labels',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	y2_fmt: {
		type: String,
		required: false,
		description: 'Format for y2 values and axis labels',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	series: {
		type: String,
		required: false,
		description: 'Column name for series',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	point_title: {
		type: String,
		required: false,
		description: 'Column name for individual point labels displayed at the top of the tooltip',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	...TITLE_ATTRIBUTES,
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE,
	x_sort: {
		type: ZodAttribute.create(
			z.union([z.enum(['asc', 'desc', 'data']), z.array(z.string())]).optional()
		),
		required: false,
		description:
			'Sort order for x-axis categories. Options: `asc` (alphabetical), `desc` (reverse alphabetical), `data` (preserve query order), or an array for custom order like `["A", "B", "C"]`',
		affectsQuery: true
	},
	y_axis_options: {
		type: ZodAttribute.create(yAxisOptionsSchema),
		required: false,
		default: {},
		description: 'Configure the y-axis'
	},
	y2_axis_options: {
		type: ZodAttribute.create(yAxisOptionsSchema),
		required: false,
		default: {},
		description: 'Configure the secondary y-axis'
	},
	x_axis_options: {
		type: ZodAttribute.create(xAxisOptionsSchema),
		required: false,
		default: {},
		description: 'Configure the x-axis'
	},
	legend: {
		type: Boolean,
		required: false,
		default: true,
		description:
			"Show legend. Studio's built-in legend renders a compact color swatch + series name. For chart-wide style overrides that need the legend to reflect them precisely (line width, custom symbols, richer styling), set `legend=false` and provide `legend={ show=true ... }` inside `echarts_options` to use ECharts' native legend instead.",
		affectsQuery: false
	},
	legend_location: {
		type: ZodAttribute.create(z.enum(['top', 'bottom'])),
		required: false,
		default: 'top',
		description: 'Position of the legend (top or bottom)',
		affectsQuery: false
	},
	series_order: {
		type: ZodAttribute.create(z.array(z.string()).optional()),
		required: false,
		description:
			'Array of series names to define the order of series in the chart and legend. Series not in the array will appear after the ordered ones.',
		affectsQuery: false
	},
	chart_options: {
		type: ZodAttribute.create(
			z.object({
				color_palette: colorPaletteSchema,
				series_colors: seriesColorsSchema,
				zoom: z
					.boolean()
					.optional()
					.default(false)
					.describe('Enables zoom by dragging on the chart area'),
				top_padding: z
					.number()
					.optional()
					.default(0)
					.describe(
						'Additional padding (in px) above the chart area to prevent labels from being cut off'
					)
			})
		),
		required: false,
		description:
			'Studio-shaped chart styling shortcuts (palette, series colors, zoom, padding). For raw ECharts overrides, use `echarts_options` instead.',
		affectsQuery: false
	},
	echarts_options: {
		type: ZodAttribute.create(
			setZodMetadata(z.record(z.unknown()).optional(), {
				blockExample: `\`\`\`
echarts_options={
    tooltip={ position="top" }
    dataZoom=[{ type="slider" }]
}
\`\`\``
			})
		),
		required: false,
		description:
			"Raw [ECharts options](https://echarts.apache.org/en/option.html) deep-merged over the chart's final configuration. Use for anything the structured props do not expose — `dataZoom`, `visualMap`, `graphic`, tooltip styling, and so on. Partial overrides win key-by-key without clobbering Studio's computed siblings. For per-series overrides, use `echarts_series_options` or the per-series `echarts_options` on a `line`/`bar`/etc. child.",
		affectsQuery: false
	},
	echarts_series_options: {
		type: ZodAttribute.create(
			setZodMetadata(z.record(z.unknown()).optional(), {
				blockExample: `\`\`\`
echarts_series_options={
    itemStyle={ borderRadius=8 }
    markLine={ data=[{ type="average" }] }
}
\`\`\``
			})
		),
		required: false,
		description:
			'Raw [ECharts series options](https://echarts.apache.org/en/option.html#series) deep-merged into every data series in the chart. Use when the same override should apply to all series. Skips reference lines/areas/points. For a single series, set `echarts_options` on the series child instead.',
		affectsQuery: false
	}
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'combo_chart',
	category: 'chart',
	keywords: ['mixed chart', 'combination chart', 'dual axis'],
	selfClosing: false,
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('x', 'data', 'select'),
		validateSqlExpression('size', 'data', 'select'),
		validateSqlExpression('series', 'data', 'select'),
		// Skip the standard date-attributes check when any child series is
		// metric-driven: `x`/`date` on the parent are optional in that case
		// (the metric view supplies the time column), so the generic validator's
		// "must specify a date column" message would be a false positive.
		(node, config, context) => {
			const seriesTags = ['area', 'bar', 'bubble', 'line', 'scatter'];
			const hasMetricChild = ((node.children ?? []) as Node[]).some(
				(c) => seriesTags.includes(c.tag ?? '') && c.attributes?.metric
			);
			if (hasMetricChild) return [];
			return validateDateAttributes()(node, config, context);
		},
		validateDateRange(),
		validateSqlOptions(),
		validateInfoRequiresTitle,
		axisHasAggregation('x', 'y'),
		validateFormatCode('x_fmt'),
		validateFormatCode('y_fmt'),
		validateFormatCode('y2_fmt'),
		validateFormatCode('size_fmt'),
		validateAxisMinMax('x_axis_options'),
		validateAxisMinMax('y_axis_options'),
		validateAxisMinMax('y2_axis_options'),
		validateEmptyAttributes(),
		validateVariablesInComponent(),
		(node, ...args) => {
			// Hack to only run this validation on combo_chart, not components that inherit this component's validation
			// TODO clean up
			if (node.tag !== 'combo_chart') return [];
			return hasChild(['area', 'bar', 'bubble', 'line', 'scatter'])(node, ...args);
		},
		// Cross-child validation for metric mode: walk the children ONCE and enforce
		// the "data required for raw children" + "metric bases must be compatible
		// with parent data" invariants that dataSources can't express (dataSources
		// reads the current node's attributes; this rule spans siblings).
		(node, _config, context) => {
			if (node.tag !== 'combo_chart') return [];
			if (!isValidationContext(context)) return [];

			const seriesTags = ['area', 'bar', 'bubble', 'line', 'scatter'];
			const seriesChildren = ((node.children ?? []) as Node[]).filter((c) =>
				seriesTags.includes(c.tag ?? '')
			);
			if (seriesChildren.length === 0) return []; // hasChild already flags this

			const parentData =
				typeof node.attributes?.data === 'string' && node.attributes.data.trim() !== ''
					? node.attributes.data.trim()
					: undefined;
			const parentX =
				typeof node.attributes?.x === 'string' && node.attributes.x.trim() !== ''
					? node.attributes.x.trim()
					: undefined;

			const rawChildren = seriesChildren.filter((c) => !c.attributes?.metric);
			const metricChildren = seriesChildren.filter((c) => c.attributes?.metric);

			// Raw children need parent `data=` — they have no other way to get a table.
			if (rawChildren.length > 0 && !parentData) {
				return [
					{
						id: 'combo-chart-missing-data',
						level: 'error',
						message:
							'combo_chart needs `data=` when any child series uses raw `y=`. Set `data=` on the combo_chart, or switch every child to `metric=`.',
						location: node.location
					}
				];
			}

			// Raw children also need parent `x=` — a metric child would fall back to
			// its view's time column, but a raw child has no such fallback.
			if (rawChildren.length > 0 && !parentX) {
				return [
					{
						id: 'combo-chart-missing-x',
						level: 'error',
						message:
							'combo_chart needs `x=` when any child series uses raw `y=`. Set `x=` on the combo_chart, or switch every child to `metric=`.',
						location: node.location
					}
				];
			}

			// Cross-base check: when parent has `data=` AND a metric child's view has
			// a base that differs from parent's `data=`, the query will target the
			// wrong table. Surface at edit time rather than silently emitting a
			// broken query. Skipped when we can't inspect the catalog (CLI syntax
			// pass, or a metric name that's a runtime variable).
			const catalog = context.metricsCatalog;
			if (parentData && catalog) {
				for (const child of metricChildren) {
					const raw = child.attributes?.metric;
					const name =
						typeof raw === 'string'
							? raw.trim()
							: Array.isArray(raw) && typeof raw[0] === 'string'
								? raw[0].trim()
								: undefined;
					if (!name || /\{\{[^}]+\}\}/.test(name)) continue;
					const found = catalog.getMetric(name);
					if (!found) continue; // metricExists on the child surfaces this
					const metricBase = found.view.base;
					if (metricBase && metricBase !== parentData) {
						return [
							{
								id: 'combo-chart-base-mismatch',
								level: 'error',
								message: `combo_chart \`data="${parentData}"\` doesn't match metric "${name}"'s base ("${metricBase}"). Either remove combo_chart's \`data=\` (metric children resolve their own base) or split into two combo_charts.`,
								location: child.location ?? node.location
							}
						];
					}
				}
			}

			return [];
		}
	),
	description:
		'Display a chart with a combination of multiple series types. Accepts area, bar, bubble, line, and scatter children series.',
	attributes,
	allowedChildren: [
		'area',
		'bar',
		'bubble',
		'line',
		'scatter',
		'reference_line',
		'reference_area',
		'reference_point'
	],
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 250,
			minHeight: 215
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% combo_chart
    data="demo.daily_orders"
    x="date"
    date_grain="month"
%}
    {% line
        y="sum(total_sales)"
    /%}
    {% bar
        y="sum(transactions)"
        axis="y2"
    /%}
{% /combo_chart %}
`
		},
		{
			title: 'Combo Chart with Area and Line',
			example: `
{% combo_chart
    data="demo.daily_orders"
    x="date"
    date_grain="month"
%}
    {% area
        y="sum(total_sales)"
    /%}
    {% line
        y="avg(avg_transaction_value)"
        axis="y2"
    /%}
{% /combo_chart %}
`
		},
		{
			title: 'Combo Chart with Formatting',
			example: `
{% combo_chart
    data="demo.daily_orders"
    x="date"
    y_fmt="usd"
    y2_fmt="num0"
    title="Sales and Transactions Overview"
    subtitle="Combined view of sales and transaction volume"
    date_grain="month"
%}
    {% line
        y="sum(total_sales)"
    /%}
    {% bar
        y="sum(transactions)"
        axis="y2"
    /%}
{% /combo_chart %}
`
		},
		{
			title: 'Raw ECharts overrides',
			example: `
{% combo_chart
    data="demo.daily_orders"
    x="date"
    date_grain="month"
    echarts_options={
        dataZoom=[{ type="slider" }]
        tooltip={ position="top" }
    }
    echarts_series_options={
        itemStyle={ borderRadius=4 }
    }
%}
    {% bar y="sum(total_sales)" /%}
{% /combo_chart %}
`
		}
	]
} as const satisfies UserComponentSchema;
