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
import { getTableFromContext, stripTypeCast } from '../../../validators/types';
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
			'Sort order for x-axis categories. Options: `asc` (alphabetical), `desc` (reverse alphabetical), `data` (preserve query order), or an array for custom order like `["A", "B", "C"]`. Prefer the newer `sort` prop for x/y direction sorting.',
		affectsQuery: true
	},
	sort: {
		type: ZodAttribute.create(
			z.union([z.enum(['x asc', 'x desc', 'y asc', 'y desc']), z.array(z.string())]).optional()
		),
		required: false,
		description:
			'Sort order for the chart. `"x asc"` / `"x desc"` sort by the x-axis label. `"y asc"` / `"y desc"` sort by the y value — `"y desc"` puts the biggest bars first. On stacked or grouped bars, y-sort ranks categories by the stack total. On a multi-child combo (e.g. bar + line), y-sort ranks by the first child\'s measure — put the measure you want to rank by first, or use `order="sum(...) desc"` for finer control. An array like `["A", "B", "C"]` renders categories in that exact order (unlisted values keep their position and land after). Only affects charts with a categorical x axis — on `date_grain` charts, points and bars position by their date, and on scatter/bubble by (x, y) coordinates. Leave unset and aggregating charts default to alphabetical x; non-aggregating charts (bare `x=`/`y=`) preserve the source query\'s own `ORDER BY`.',
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
		// Warn when both `sort` (new) and `x_sort` (legacy) are set. `sort`
		// wins silently, which surprises anyone still using the old prop —
		// they'd wonder why editing `x_sort` did nothing.
		(node) => {
			if (!node.attributes?.sort || !node.attributes?.x_sort) return [];
			return [
				{
					id: 'sort-shadows-x-sort',
					level: 'warning' as const,
					message:
						'Both `sort` (new) and `x_sort` (legacy) are set. `sort` wins — `x_sort` is ignored. Remove one of them.',
					location: node.location
				}
			];
		},
		// Multi-child combo + `sort="y *"` — call out the "first child wins"
		// rule (matches Tableau/PowerBI/Vega-Lite for dual-axis charts) so an
		// author who put the "obviously important" measure second doesn't get
		// silently ranked by the other one. Only fires on combo_chart itself
		// (bar_chart / line_chart / etc. inherit combo_chart's validate but
		// only have one implicit child each, so the rule doesn't apply to
		// them). Skipped when `sort=[...]` (array form) is used — that
		// bypasses the y-ranking entirely.
		(node) => {
			if (node.tag !== 'combo_chart') return [];
			const sort = node.attributes?.sort;
			if (sort !== 'y asc' && sort !== 'y desc') return [];
			const seriesTags = ['area', 'bar', 'bubble', 'line', 'scatter'];
			const seriesChildren = ((node.children ?? []) as { tag?: string }[]).filter((c) =>
				seriesTags.includes(c.tag ?? '')
			);
			if (seriesChildren.length < 2) return [];
			return [
				{
					id: 'sort-multi-child-first-wins',
					level: 'warning' as const,
					message: `sort="${sort}" on a multi-child combo ranks categories by the FIRST child's measure only. If a different child is your primary metric, put it first; for anything else use \`order="sum(...) desc"\` or \`sort=["A","B",...]\`.`,
					location: node.location
				}
			];
		},
		// Same warning for `order=` — a raw ORDER BY escape hatch that also
		// gets silently overridden by `sort`.
		(node) => {
			if (!node.attributes?.sort || !node.attributes?.order) return [];
			return [
				{
					id: 'sort-shadows-order',
					level: 'warning' as const,
					message:
						'Both `sort` and `order=` are set. `sort` wins — the `order=` clause is ignored. Remove `order=` or drop `sort`.',
					location: node.location
				}
			];
		},
		// Warn when `sort` is set and the x axis will render as a time/value
		// axis (i.e. positions come from the data value, not from array
		// order). Three signals — any one is enough to conclude "this is a
		// time/value x axis":
		//   1. `date_grain=` set — author's explicit intent
		//   2. `x_axis_options.type="time"` — author's explicit override
		//   3. `x` is a bare date/datetime/timestamp column per catalog metadata
		// Coverage matches what the runtime layer's `XAxisModel` decides
		// (jsType + date_grain + user override) as closely as we can at edit
		// time. The runtime layer honors this correctly on its own — the
		// anti-zigzag `sortRowsByX` fires on `!treatAsCategoryAxis`, and
		// scatter/bubble skip the reorder — so this warning is purely
		// author-feedback about intent, never a correctness gate.
		(node, _config, context) => {
			const sort = node.attributes?.sort;
			if (!sort) return [];

			const hasDateGrain = node.attributes?.date_grain !== undefined;
			const xAxisType = (node.attributes?.x_axis_options as { type?: string } | undefined)?.type;
			const axisOverrideIsTime = xAxisType === 'time';

			// Metadata lookup — only reachable in ValidationContext (which
			// carries the catalog). At the CLI syntax-check pass, this call
			// short-circuits and we fall back to the two attribute signals.
			let xIsDateColumn = false;
			if (isValidationContext(context)) {
				const xRaw = node.attributes?.x;
				const tableName = node.attributes?.data;
				if (
					typeof xRaw === 'string' &&
					typeof tableName === 'string' &&
					/^[A-Za-z_][A-Za-z0-9_]*$/.test(xRaw)
				) {
					const table = getTableFromContext(tableName, context);
					const column = table?.getColumn(stripTypeCast(xRaw));
					const columnType = (column?.type || '').toLowerCase();
					xIsDateColumn = /date|datetime|timestamp/.test(columnType);
				}
			}

			if (!hasDateGrain && !axisOverrideIsTime && !xIsDateColumn) return [];

			const shape = Array.isArray(sort) ? 'sort=[...]' : `sort="${sort}"`;
			return [
				{
					id: 'sort-effectively-ignored-on-time-axis',
					level: 'warning' as const,
					message: `${shape} has no visual effect on a time-axis chart — points and bars are positioned by their date/period value, not by array order. (On line/area charts, \`sort="x desc"\` DOES reverse the polyline direction so it draws right-to-left.) To rank by y or an explicit category order, cast the x column to a string / non-date and drop \`date_grain\`.`,
					location: node.location
				}
			];
		},
		// Warn when `sort` is set on scatter_chart or bubble_chart. Points
		// position by their (x, y) coordinates on continuous axes, so `sort`
		// can't MOVE them — but this is not a clean no-op: the SQL `ORDER BY`
		// still fires (deliberate; scatter often pairs sort with `limit=` for
		// top-N row pruning), and reordering the rows changes which series
		// row lands first in each `series` bucket, which in turn changes
		// legend order and positional color palette assignment. Give the
		// author both knobs — `series_order=` for legend order,
		// `series_colors=` for palette independence — so they can lock those
		// down instead of relying on data-order side effects.
		(node) => {
			if (node.tag !== 'scatter_chart' && node.tag !== 'bubble_chart') return [];
			if (!node.attributes?.sort) return [];
			return [
				{
					id: 'sort-not-meaningful-on-scatter',
					level: 'warning' as const,
					message: `\`sort\` doesn't reposition points on ${node.tag} — they're placed by (x, y) coordinates. It still affects the underlying SQL ORDER BY, which can silently change legend order and palette color assignment when a \`series\` column is set (the first row per series determines that series' position). Use \`series_order=[...]\` to lock the legend and \`series_colors={...}\` to lock colors; use \`order="..."\` + \`limit=\` for row pruning.`,
					location: node.location
				}
			];
		},
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
		},
		{
			title: 'Sort bars biggest first (Pareto)',
			example: `
{% combo_chart
    data="demo.daily_orders"
    x="category"
    sort="y desc"
%}
    {% bar y="sum(total_sales)" /%}
{% /combo_chart %}
`
		},
		{
			title: 'Explicit category order',
			example: `
{% combo_chart
    data="demo.daily_orders"
    x="category"
    sort=["Enterprise", "SMB", "Consumer"]
%}
    {% bar y="sum(total_sales)" /%}
{% /combo_chart %}
`
		},
		{
			title: 'Preserve source ORDER BY (waterfall)',
			example: `
\`\`\`sql waterfall
SELECT 'Start' AS step, 100 AS amount
UNION ALL SELECT 'Add', 50
UNION ALL SELECT 'Subtract', -30
UNION ALL SELECT 'End', 120
ORDER BY 1
\`\`\`

{% combo_chart data="waterfall" x="step" %}
    {% bar y="amount" /%}
{% /combo_chart %}
`
		}
	]
} as const satisfies UserComponentSchema;
