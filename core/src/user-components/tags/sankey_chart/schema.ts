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

import {
	ECHARTS_OPTIONS_ATTRIBUTE,
	ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} from '../../common/echarts-options-attributes';

/** True when the component is NOT in metric mode (uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

const dataSources = [
	{ requires: ['data', 'source', 'target', 'value'], forbids: ['metric'] },
	{ requires: ['metric', 'source', 'target'], forbids: ['data', 'value'] }
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
	source: {
		type: String,
		required: true,
		description: 'Column name for source nodes',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	target: {
		type: String,
		required: true,
		description: 'Column name for target nodes',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: false,
		suggested: true,
		description: 'Column name for flow values. Omit when using `metric`.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	percent: {
		type: String,
		required: false,
		description: 'Column name for percentage values (optional)',
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
	node_labels: {
		type: String,
		required: false,
		default: 'name',
		description: 'Node label display',
		matches: ['name', 'value', 'full'],
		affectsQuery: false
	},
	link_labels: {
		type: String,
		required: false,
		description: 'Link label display',
		matches: ['value', 'percent', 'full', 'none'],
		affectsQuery: false
	},
	node_align: {
		type: String,
		required: false,
		default: 'justify',
		description: 'Node alignment',
		matches: ['justify', 'left', 'right', 'top', 'bottom'],
		affectsQuery: false
	},
	node_gap: {
		type: Number,
		required: false,
		default: 10,
		description: 'Gap between nodes in pixels',
		affectsQuery: false
	},
	node_width: {
		type: Number,
		required: false,
		default: 20,
		description: 'Width of nodes in pixels',
		affectsQuery: false
	},
	orient: {
		type: String,
		required: false,
		default: 'horizontal',
		description: 'Orientation',
		matches: ['horizontal', 'vertical'],
		affectsQuery: false
	},
	sort: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Sort nodes by value',
		affectsQuery: false
	},
	link_color: {
		type: String,
		required: false,
		default: 'source',
		description: 'Link color mode',
		matches: ['source', 'target', 'gradient'],
		affectsQuery: false
	},
	outline_color: {
		type: String,
		required: false,
		description: 'Node outline color',
		affectsQuery: false
	},
	outline_width: {
		type: Number,
		required: false,
		default: 0,
		description: 'Node outline width in pixels',
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
	render: 'sankey_chart',
	category: 'chart',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('source', 'data', 'select'),
		validateSqlExpression('target', 'data', 'select'),
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
	description: 'Display a Sankey diagram showing flow between nodes',
	keywords: ['sankey diagram', 'flow diagram', 'alluvial'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 400,
			minHeight: 300
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% sankey_chart
    data="demo.order_details"
    source="category"
    target="item_name"
    value="sum(quantity)"
/%}
`
		},
		{
			title: 'Sankey Chart with Custom Colors',
			example: `
{% sankey_chart
    data="demo.order_details"
    source="category"
    target="item_name"
    value="sum(quantity)"
    title="Category to Item Flow"
    chart_options={
        color_palette = ["#0d0887", "#6300a7", "#a62098", "#d5546e", "#f68d45", "#fcd225", "#f0f921"]
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
