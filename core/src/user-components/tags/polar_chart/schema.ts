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
import { TOOLTIP_FIELDS_ATTRIBUTE, validateTooltipFieldFormats } from '../../common/tooltip-fields';
import { z } from 'zod';
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

const attributes = {
	data: {
		type: String,
		required: false,
		suggested: true,
		description: 'Name of the table to query. Omit when using `metric`.',
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
		description: 'Column name for categories (angle axis labels)',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	series: {
		type: String,
		required: false,
		description: 'Column name for series grouping (different series/stacks)',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: false,
		suggested: true,
		description: 'Column name for values (bar heights). Omit when using `metric`.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	title: {
		type: String,
		required: false,
		description: 'Title to display above the chart',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	subtitle: {
		type: String,
		required: false,
		description: 'Subtitle to display below the title',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info: {
		type: String,
		required: false,
		description: 'Information tooltip text (can only be used with title)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link: {
		type: String,
		required: false,
		description: 'URL to link the info text to (can only be used with info)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link_title: {
		type: String,
		required: false,
		description:
			'Create a custom link title for the info link, placed after the info text (can only be used with info_link)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	value_fmt: {
		type: String,
		required: false,
		description: 'Format for values (defaults to `num`, or the metric format in metric mode).',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
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
				color_palette: z.array(z.string()).optional()
			})
		),
		required: false,
		default: {},
		description: 'Chart configuration options',
		affectsQuery: false
	},
	stack: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Stack bars by category',
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
	render: 'polar_chart',
	category: 'chart',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('category', 'data', 'select'),
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
	description: 'Display a polar chart with bars arranged in a circular pattern',
	keywords: ['rose chart', 'radial chart'],
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
{% polar_chart
    data="demo.daily_orders"
    category="category"
    value="sum(total_sales)"
/%}
`
		},
		{
			title: 'Polar Chart with Custom Colors',
			example: `
{% polar_chart
    data="demo.daily_orders"
    value="sum(total_sales)"
    category="category"
    series="category"
    title="Sales by Category"
    chart_options={
        color_palette = ["#0d0887", "#6300a7", "#a62098", "#d5546e", "#f68d45", "#fcd225", "#f0f921"]
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
