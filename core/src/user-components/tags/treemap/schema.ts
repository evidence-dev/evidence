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
import { TOOLTIP_FIELDS_ATTRIBUTE, validateTooltipFieldFormats } from '../../common/tooltip-fields';
import { METRIC_ATTRIBUTE } from '../../common/metric-attribute';
import { validateDataSources, type DataSource } from '../../common/data-sources';
import {
	ECHARTS_OPTIONS_ATTRIBUTE,
	ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} from '../../common/echarts-options-attributes';

/** True when the component is NOT in metric mode (uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

const dataSources = [
	{ requires: ['data', 'category', 'value'], forbids: ['metric'] },
	{ requires: ['metric', 'category'], forbids: ['data', 'value'] }
] as const satisfies readonly DataSource[];

import { CROSS_FILTER_ATTRIBUTES } from '../../common/cross-filter-attributes';

const attributes = {
	data: {
		type: String,
		required: false,
		suggested: true,
		suggestionType: 'table',
		description: 'Table or view to query. Omit when using `metric`.',
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
	...CROSS_FILTER_ATTRIBUTES,
	...DATE_RANGE_ATTRIBUTE,
	category: {
		type: String,
		required: true,
		description: 'Column name for categories (one rectangle per category)',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	group: {
		type: String,
		required: false,
		description: 'Column name for grouping categories into parent rectangles (optional)',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: false,
		suggested: true,
		description: 'Column name for values (rectangle sizes). Omit when using `metric`.',
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
	show_values: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Show formatted values on rectangle labels',
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
	...CONNECT_GROUP_ATTRIBUTE,
	...TOOLTIP_FIELDS_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'treemap',
	category: 'chart',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('category', 'data', 'select'),
		validateSqlExpression('group', 'data', 'select'),
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
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
	description: 'Display a treemap of nested rectangles sized by value',
	keywords: ['treemap', 'tree map', 'mosaic', 'hierarchy chart'],
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
{% treemap
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
/%}
`
		},
		{
			title: 'Grouped Treemap',
			example: `
{% treemap
    data="demo.order_details"
    group="category"
    category="item_name"
    value="sum(quantity)"
    title="Quantity by Category and Item"
/%}
`
		},
		{
			title: 'With Values on Labels',
			example: `
{% treemap
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
    title="Sales by Category"
    value_fmt="usd"
    show_values=true
/%}
`
		},
		{
			title: 'With Custom Colors',
			example: `
{% treemap
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
{% treemap
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
    echarts_series_options={
        itemStyle={ borderRadius=8 gapWidth=4 }
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
