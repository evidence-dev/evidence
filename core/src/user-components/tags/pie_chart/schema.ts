import type { UserComponentSchema } from '../../types';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import {
	and,
	filtersExist,
	tableExists,
	validateSqlExpression,
	validateDateAttributes,
	validateSqlOptions,
	expressionHasAggregation,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	validateDateRange,
	metricExists
} from '../../validators';
import { ifCondition } from '../../validators/ifCondition';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import { z } from 'zod';
import { TITLE_ATTRIBUTES } from '../../common/title-attributes';
import { TOOLTIP_FIELDS_ATTRIBUTE, validateTooltipFieldFormats } from '../../common/tooltip-fields';
import { METRIC_ATTRIBUTE } from '../../common/metric-attribute';
import { validateDataSources, type DataSource } from '../../common/data-sources';

/** True when the component is NOT in metric mode (i.e. uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

const dataSources = [
	{ requires: ['data', 'category', 'value'], forbids: ['metric'] },
	{ requires: ['metric', 'category'], forbids: ['data', 'value'] }
] as const satisfies readonly DataSource[];

import {
	ECHARTS_OPTIONS_ATTRIBUTE,
	ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} from '../../common/echarts-options-attributes';

const attributes = {
	data: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold (raw-mode default) though not required.
		suggested: true,
		suggestionType: 'table',
		description: 'Name of the table or view to query. Omit when using `metric`.',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	...METRIC_ATTRIBUTE,
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...DATE_RANGE_ATTRIBUTE,
	// Category stays required in both raw and metric modes — there is no
	// view-level default slice dimension in v1, so `metric="revenue"` without
	// `category=` should error rather than render a mystery pie.
	category: {
		type: String,
		required: true,
		description: 'Column name for categories (pie slices)',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold (raw-mode default) though not required.
		suggested: true,
		description: 'Column name for values (slice sizes). Omit when using `metric`.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	...TITLE_ATTRIBUTES,
	inner_radius: {
		type: String,
		required: false,
		default: '40%',
		description: 'Inner radius of the pie (use 0% for full pie, >0% for donut style)',
		affectsQuery: false
	},
	value_fmt: {
		type: String,
		required: false,
		default: 'num',
		description: 'Format for values',
		affectsQuery: false,
		suggestionType: 'format'
	},
	legend: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Show legend instead of slice labels',
		affectsQuery: false
	},
	pct: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Show percentage values on pie slice labels',
		affectsQuery: false
	},
	pct_fmt: {
		type: String,
		required: false,
		default: 'pct1',
		description: 'Format for percentage values (e.g., pct0, pct1, pct2)',
		affectsQuery: false,
		suggestionType: 'format'
	},
	legend_location: {
		type: ZodAttribute.create(z.enum(['top', 'bottom'])),
		required: false,
		default: 'top',
		description: 'Position of the legend (top or bottom)',
		affectsQuery: false
	},
	chart_options: {
		type: ZodAttribute.create(
			z.object({
				color_palette: z.array(z.string()).optional(),
				series_colors: z.record(z.string(), z.string()).optional()
			})
		),
		required: false,
		default: {},
		description: 'Chart configuration options',
		affectsQuery: false
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE,
	...TOOLTIP_FIELDS_ATTRIBUTE,
	...ECHARTS_OPTIONS_ATTRIBUTE,
	...ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'pie_chart',
	category: 'chart',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('category', 'data', 'select'),
		// With `metric`, the aggregate comes from the metric definition — skip the
		// SQL/aggregation checks that only apply to the raw `value=` expression.
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
		validateDateAttributes(),
		validateDateRange(),
		validateSqlOptions(),
		ifCondition(notMetric, expressionHasAggregation('value')),
		validateInfoRequiresTitle,
		validateFormatCode('value_fmt'),
		validateFormatCode('pct_fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display a pie chart (donut style by default, use inner_radius="0%" for full pie)',
	keywords: ['donut chart', 'donut', 'pie graph', 'ring chart'],
	attributes,
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
{% pie_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
/%}
`
		},
		{
			title: 'Pie Chart with Title',
			example: `
{% pie_chart
    data="demo.daily_orders"
    value="sum(total_sales)"
    category="category"
    title="Sales by Category"
/%}
`
		},
		{
			title: 'With Custom Colors',
			example: `
{% pie_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
    title="Sales by Category"
    chart_options={
        color_palette = ["#0d0887", "#6300a7", "#a62098", "#d5546e", "#f68d45", "#fcd225", "#f0f921"]
    }
/%}
`
		},
		{
			title: 'With Series Colors',
			example: `
{% pie_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
    title="Sales by Category"
    chart_options={
        series_colors={
            "Electronics"="#3b82f6"
            "Clothing"="#22c55e"
            "Home"="#f59e0b"
            "Sports"="#ef4444"
        }
    }
/%}
`
		},
		{
			title: 'With Percentage Labels',
			example: `
{% pie_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
    title="Sales by Category"
    pct=true
/%}
`
		},
		{
			title: 'With Custom Percentage Format',
			example: `
{% pie_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
    title="Sales by Category"
    pct=true
    pct_fmt="pct0"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
