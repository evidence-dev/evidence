import type { UserComponentSchema } from '../../types';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import {
	and,
	filtersExist,
	tableExists,
	validateSqlExpression,
	validateDateAttributes,
	validateDateRange,
	validateSqlOptions,
	expressionHasAggregation,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	metricExists
} from '../../validators';
import { ifCondition } from '../../validators/ifCondition';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import { z } from 'zod';
import { TITLE_ATTRIBUTES } from '../../common/title-attributes';
import { METRIC_ATTRIBUTE } from '../../common/metric-attribute';
import { validateDataSources, type DataSource } from '../../common/data-sources';

/** True when the component is NOT in metric mode (uses the raw data path). */
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
		suggested: true,
		description: 'Name of the table or view to query. Omit when using `metric`.',
		suggestionType: 'table',
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
	category: {
		type: String,
		required: true,
		description: 'Column name for categories (one radar axis per category)',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	series: {
		type: String,
		required: false,
		description: 'Column name for series grouping (one polygon per series)',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: false,
		suggested: true,
		description:
			'Column name for values (distance from center on each axis). Omit when using `metric`.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	...TITLE_ATTRIBUTES,
	value_fmt: {
		type: String,
		required: false,
		description: 'Format for values (defaults to `num`, or the metric format in metric mode).',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	max: {
		type: Number,
		required: false,
		description: 'Maximum value for the radar axes (defaults to the largest value in the data)',
		affectsQuery: false
	},
	shape: {
		type: String,
		required: false,
		default: 'polygon',
		description: 'Shape of the radar grid',
		matches: ['polygon', 'circle'],
		affectsQuery: false
	},
	fill: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Fill the area enclosed by each series',
		affectsQuery: false
	},
	show_values: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Show formatted values at each point',
		affectsQuery: false
	},
	legend: {
		type: Boolean,
		required: false,
		description:
			'Show legend for series (defaults to true when series is provided, false otherwise)',
		affectsQuery: false
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
	...ECHARTS_OPTIONS_ATTRIBUTE,
	...ECHARTS_SERIES_OPTIONS_ATTRIBUTE,
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'radar_chart',
	category: 'chart',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('category', 'data', 'select'),
		validateSqlExpression('series', 'data', 'select'),
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateDateAttributes(),
		validateDateRange(),
		validateSqlOptions(),
		ifCondition(notMetric, expressionHasAggregation('value')),
		validateInfoRequiresTitle,
		validateFormatCode('value_fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display a radar chart comparing values across multiple axes',
	keywords: ['radar chart', 'spider chart', 'web chart', 'star chart'],
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
{% radar_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
/%}
`
		},
		{
			title: 'Radar Chart with Multiple Series',
			example: `
{% radar_chart
    data="demo.daily_orders"
    category="category"
    series="year(date)"
    value="sum(total_sales)"
    title="Sales by Category and Year"
/%}
`
		},
		{
			title: 'With Custom Colors',
			example: `
{% radar_chart
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
			title: 'With Raw ECharts Overrides',
			example: `
{% radar_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
    echarts_series_options={
        lineStyle={ width=3 }
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
