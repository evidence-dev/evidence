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
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import { z } from 'zod';
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
	{ requires: ['data', 'date', 'value'], forbids: ['metric'] },
	{ requires: ['metric', 'date'], forbids: ['data', 'value'] }
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
	date: {
		type: String,
		required: true,
		description: 'Column name for dates',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: false,
		suggested: true,
		description: 'Column name for cell values. Omit when using `metric`.',
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
		default: true,
		description: 'Show color scale legend',
		affectsQuery: false
	},
	borders: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Show borders between calendar cells',
		affectsQuery: false
	},
	chart_options: {
		type: ZodAttribute.create(
			z.object({
				color_scale: z
					.array(z.string())
					.optional()
					.describe(
						'Array of hex colors for the heatmap gradient. A single-color array auto-expands to [background, color].'
					),
				// Deprecated alias for `color_scale`; kept to avoid breaking published
				// pages. Components read `color_scale ?? color_palette` and warn (dev
				// only) when authors still use this name.
				color_palette: z
					.array(z.string())
					.optional()
					.describe('Deprecated. Use `color_scale`.'),
				conditional_colors: z
					.string()
					.optional()
					.describe('SQL CASE expression returning hex colors based on value'),
				color_map: z
					.record(z.string(), z.string())
					.optional()
					.describe('Maps hex colors to legend labels when using conditional_colors')
			})
		),
		required: false,
		default: {},
		description: 'Color and styling options for the heatmap',
		affectsQuery: true
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE,
	...TOOLTIP_FIELDS_ATTRIBUTE,
	...ECHARTS_OPTIONS_ATTRIBUTE,
	...ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'calendar_heatmap',
	category: 'chart',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('date', 'data', 'select'),
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateSqlExpression('chart_options.conditional_colors', 'data', 'select'),
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
	description: 'Display a calendar heatmap visualization',
	keywords: ['calendar chart', 'activity chart', 'contribution graph'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 280,
			minHeight: 215
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% calendar_heatmap
    data="demo.daily_orders"
    date="date"
    value="sum(total_sales)"
/%}
`
		},
		{
			title: 'Calendar Heatmap with Custom Colors',
			example: `
{% calendar_heatmap
    data="demo.daily_orders"
    date="date"
    value="sum(total_sales)"
    title="Daily Sales Heatmap"
    chart_options={
        color_scale = ["#0d0887", "#6300a7", "#a62098", "#d5546e", "#f68d45", "#fcd225", "#f0f921"]
    }
/%}
`
		},
		{
			title: 'Calendar Heatmap with Conditional Colors',
			example: `
{% calendar_heatmap
    data="demo.daily_orders"
    date="date"
    value="sum(total_sales)"
    title="Sales Performance Heatmap"
    chart_options={
        conditional_colors = "case when sum(total_sales) > 65000 then '#22c55e' when sum(total_sales) > 40000 then '#f59e0b' else '#ef4444' end"
    }
/%}
`
		},
		{
			title: 'Calendar Heatmap with Conditional Colors and Legend',
			example: `
{% calendar_heatmap
    data="demo.daily_orders"
    date="date"
    value="sum(total_sales)"
    title="Sales Performance Heatmap"
    chart_options={
        conditional_colors="case when sum(total_sales) > 65000 then '#22c55e' when sum(total_sales) > 40000 then '#f59e0b' else '#ef4444' end"
        color_map={
            "#22c55e"="High Sales"
            "#f59e0b"="Medium Sales"
            "#ef4444"="Low Sales"
        }
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
