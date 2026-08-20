import type { UserComponentSchema } from '../../types';
import {
	and,
	tableExists,
	filtersExist,
	columnsExistInTable,
	validateSqlExpression,
	validateDateAttributes,
	validateDateRange,
	validateComparison,
	validateBenchmarkProperties,
	validateSqlOptions,
	expressionHasAggregation,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	metricExists
} from '../../validators';
import { ifCondition } from '../../validators/ifCondition';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { baseComparisonSchema } from '../../common/comparison-schema';
import { ZodAttribute } from '../../common/zod-attribute';
import { METRIC_ATTRIBUTE } from '../../common/metric-attribute';
import { validateDataSources, type DataSource } from '../../common/data-sources';

const comparisonSchema = baseComparisonSchema.optional();

/** True when the component is NOT in metric mode (i.e. uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

const dataSources = [
	{ requires: ['data', 'value'], forbids: ['metric'] },
	{ requires: ['metric'], forbids: ['data', 'value'] }
] as const satisfies readonly DataSource[];

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
	value: {
		type: String,
		required: false,
		suggested: true,
		description:
			'SQL expression to insert into the SELECT part of the query (e.g., "COUNT(*)", "SUM(sales)"). Omit when using `metric`.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	className: {
		type: String,
		required: false,
		description: 'CSS class to apply to the value',
		affectsQuery: false
	},
	fmt: {
		type: String,
		required: false,
		description:
			'Format code for the value (e.g., "num", "usd", "pct"). See formatValue documentation for available formats.',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	color: {
		type: String,
		required: false,
		description: 'CSS color to apply to the value (e.g., "red", "#ff0000", "rgb(255,0,0)")',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	redNegatives: {
		type: Boolean,
		required: false,
		description: 'When true, negative values will be displayed in red (rgb(220 38 38))',
		affectsQuery: false
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
	comparison: {
		type: ZodAttribute.create(comparisonSchema),
		required: false,
		default: undefined,
		description: 'Comparison configuration object',
		affectsQuery: true
	},
	filters: {
		type: Array,
		required: false,
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter'
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	// Include additional SQL options and date filtering options
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...DATE_RANGE_ATTRIBUTE,
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'value',
	category: 'value',
	keywords: ['inline value', 'metric', 'number'],
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		columnsExistInTable('data', ['date']),
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateSqlExpression('comparison.target', 'data', 'select'),
		validateSqlExpression('comparison.benchmark.where', 'data', 'where'),
		validateSqlExpression('comparison.benchmark.subject', 'data', 'select'),
		validateSqlExpression('comparison.benchmark.value', 'data', 'select'),
		validateSqlExpression('comparison.benchmark.within', 'data', 'select'),
		validateDateAttributes(),
		validateDateRange(),
		validateComparison(),
		validateBenchmarkProperties(),
		validateSqlOptions(),
		ifCondition(notMetric, expressionHasAggregation('value')),
		expressionHasAggregation('comparison.benchmark.value'),
		validateFormatCode('fmt'),
		validateFormatCode('comparison.abs_fmt'),
		validateFormatCode('comparison.pct_fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display a single value from a database query',
	attributes,
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% value data="demo.daily_orders" value="sum(total_sales)" /%}
`
		}
	]
} as const satisfies UserComponentSchema;
