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

import { CROSS_FILTER_ATTRIBUTES } from '../../common/cross-filter-attributes';

const attributes = {
	data: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold (raw-mode default) though not required.
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
	...CROSS_FILTER_ATTRIBUTES,
	...DATE_RANGE_ATTRIBUTE,
	// Category stays required in both raw and metric modes — there is no
	// view-level default stage dimension in v1, so `metric="revenue"` without
	// `category=` should error rather than render a mystery funnel.
	category: {
		type: String,
		required: true,
		description: 'Column name for funnel stages/categories',
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
		description: 'Column name for values. Omit when using `metric`.',
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
		default: 'num',
		description: 'Format for values',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	legend: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Show a legend above the chart (stages are labeled directly on the funnel by default)',
		affectsQuery: false
	},
	legend_location: {
		type: ZodAttribute.create(z.enum(['top', 'bottom'])),
		required: false,
		default: 'top',
		description: 'Position of the legend (top or bottom)',
		affectsQuery: false
	},
	label_position: {
		type: String,
		required: false,
		default: 'auto',
		description:
			'Label position: auto places labels inside each stage, moving them beside stages that are too narrow; outside places all labels in a rail beside the chart (left of the chart unless the funnel is right-aligned)',
		matches: ['auto', 'inside', 'outside', 'center'],
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
	align: {
		type: String,
		required: false,
		default: 'left',
		description: 'Funnel alignment',
		matches: ['center', 'left', 'right'],
		affectsQuery: false
	},
	show_percent: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Show percentages relative to first stage',
		affectsQuery: false
	},
	min_size: {
		type: String,
		required: false,
		default: '0%',
		description: 'Minimum size of funnel stages',
		affectsQuery: false
	},
	max_size: {
		type: String,
		required: false,
		default: '100%',
		description: 'Maximum size of funnel stages',
		affectsQuery: false
	},
	gap: {
		type: Number,
		required: false,
		default: 1,
		description: 'Gap between funnel stages in pixels',
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
	render: 'funnel_chart',
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
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display a funnel chart showing conversion rates through stages',
	keywords: ['funnel', 'conversion funnel', 'pipeline'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 320,
			// Matches the chart's min-h-[215px] and the rest of the chart family;
			// a larger value guarantees dead space under the funnel in cards.
			minHeight: 215
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% funnel_chart
    data="demo.daily_orders"
    category="category"
    value="sum(transactions)"
/%}
`
		},
		{
			title: 'Funnel Chart with Custom Styling',
			example: `
{% funnel_chart
    data="demo.daily_orders"
    category="category"
    value="sum(transactions)"
    align="left"
    label_position="outside"
    gap=5
    title="Styled Funnel"
/%}
`
		},
		{
			title: 'Funnel Chart with Custom Colors',
			example: `
{% funnel_chart
    data="demo.daily_orders"
    category="category"
    value="sum(transactions)"
    chart_options={
        color_palette = ["#0d0887", "#6300a7", "#a62098", "#d5546e", "#f68d45", "#fcd225", "#f0f921"]
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
