import type { UserComponentSchema } from '../../types';
import { BooleanVariable } from '../../common/zod-attribute';
import { DATE_RANGE_ATTRIBUTE, DATE_GRAIN_ATTRIBUTE } from '../../common/date-options';
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
	{ requires: ['data', 'x', 'y', 'value'], forbids: ['metric'] },
	{ requires: ['metric', 'x', 'y'], forbids: ['data', 'value'] }
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
	x_date_grain: DATE_GRAIN_ATTRIBUTE.date_grain,
	y_date_grain: DATE_GRAIN_ATTRIBUTE.date_grain,
	x: {
		type: String,
		required: true,
		description: 'Column name for x-axis categories',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	y: {
		type: String,
		required: true,
		description: 'Column name for y-axis categories',
		suggestionType: 'column',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	x_axis_title: {
		type: String,
		required: false,
		description: 'Title to display for the x-axis',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	y_axis_title: {
		type: String,
		required: false,
		description: 'Title to display for the y-axis',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
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
		description:
			'Info text to display in a tooltip next to the title. Can only be used with the title prop.',
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
	x_fmt: {
		type: String,
		required: false,
		default: undefined,
		description: 'Format for x axis labels',
		suggestionType: 'format'
	},
	y_fmt: {
		type: String,
		required: false,
		default: undefined,
		description: 'Format for y axis labels',
		suggestionType: 'format'
	},
	x_sort: {
		type: String,
		required: false,
		matches: ['asc', 'desc'],
		description: 'Sort order for x axis categories (asc or desc)',
		affectsQuery: false
	},
	y_sort: {
		type: String,
		required: false,
		matches: ['asc', 'desc'],
		description: 'Sort order for y axis categories (asc or desc)',
		affectsQuery: false
	},
	value_sort: {
		type: String,
		required: false,
		matches: ['asc', 'desc'],
		description:
			'Sort categories by total value (asc or desc). Applies to the first axis without explicit sort.',
		affectsQuery: false
	},
	legend: {
		type: BooleanVariable,
		required: false,
		default: true,
		description: 'Show color scale legend',
		affectsQuery: false,
		supportsVariables: true
	},
	borders: {
		type: BooleanVariable,
		required: false,
		default: true,
		description: 'Show borders around heatmap cells',
		affectsQuery: false,
		supportsVariables: true
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
					.describe('Deprecated. Use `color_scale`.')
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
	render: 'heatmap',
	category: 'chart',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('x', 'data', 'select'),
		validateSqlExpression('y', 'data', 'select'),
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
		validateDateAttributes(),
		validateDateRange(),
		validateSqlOptions(),
		ifCondition(notMetric, expressionHasAggregation('value')),
		validateInfoRequiresTitle,
		validateFormatCode('value_fmt'),
		validateFormatCode('x_fmt'),
		validateFormatCode('y_fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display a heatmap chart with color-coded cells',
	keywords: ['heat map', 'matrix chart', 'color matrix'],
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
{% heatmap
    data="demo.daily_orders"
    x="date"
    x_date_grain="year"
    y="category"
    value="sum(total_sales)"
/%}
`
		},
		{
			title: 'With Custom Colors',
			example: `
{% heatmap
    data="demo.daily_orders"
    x="date"
    x_date_grain="year"
    y="category"
    value="sum(total_sales)"
    title="Sales Intensity by Year and Category"
    chart_options={
        color_scale = ["#f7fafc", "#e2e8f0", "#cbd5e0", "#a0aec0", "#718096", "#4a5568", "#2d3748"]
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
