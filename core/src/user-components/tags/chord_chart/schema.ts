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
import { TOOLTIP_FIELDS_ATTRIBUTE, validateTooltipFieldFormats } from '../../common/tooltip-fields';
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
		description: 'Column name for flow values (chord thickness). Omit when using `metric`.',
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
	labels: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Show node labels around the circle',
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
	render: 'chord_chart',
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
	description: 'Display a chord diagram showing flows between nodes around a circle',
	keywords: ['chord diagram', 'circular flow', 'relationship diagram'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 250,
			minHeight: 250
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% chord_chart
    data="demo.order_details"
    source="category"
    target="item_name"
    value="sum(quantity)"
/%}
`
		},
		{
			title: 'Chord Chart with Custom Colors',
			example: `
{% chord_chart
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
		},
		{
			title: 'Chord Chart with Raw ECharts Overrides',
			example: `
{% chord_chart
    data="demo.order_details"
    source="category"
    target="item_name"
    value="sum(quantity)"
    echarts_options={
        series=[{ startAngle=0 padAngle=6 }]
    }
    echarts_series_options={
        itemStyle={ borderRadius=6 }
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
