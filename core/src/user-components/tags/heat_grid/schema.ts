import type { UserComponentSchema } from '../../types';
import {
	and,
	tableExists,
	filtersExist,
	validateSqlExpression,
	validateSqlOptions,
	expressionHasAggregation,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	metricExists
} from '../../validators';
import { ifCondition } from '../../validators/ifCondition';
import { SQL_OPTIONS } from '../../common/sql-options';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { ZodAttribute, booleanVariableSchema } from '../../common/zod-attribute';
import { z } from 'zod';
import { METRIC_ATTRIBUTE } from '../../common/metric-attribute';
import { validateDataSources, type DataSource } from '../../common/data-sources';

/** True when the component is NOT in metric mode (uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

const dataSources = [
	{ requires: ['data', 'dimension', 'value'], forbids: ['metric'] },
	{ requires: ['metric', 'dimension'], forbids: ['data', 'value'] }
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
	dimension: {
		type: String,
		required: true,
		suggestionType: 'column',
		description: 'Column for cell labels (e.g., province)',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	value: {
		type: String,
		required: false,
		suggested: true,
		suggestionType: 'sql',
		description:
			'SQL aggregation expression for the metric (e.g., avg(wait_time)). Omit when using `metric`.',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	thresholds: {
		type: ZodAttribute.create(z.tuple([z.number(), z.number()])),
		required: true,
		description:
			'Two numeric thresholds creating 3 color zones: [low, high]. Values below low are zone 1, between low and high are zone 2, at or above high are zone 3.',
		affectsQuery: false
	},
	units: {
		type: String,
		required: false,
		description: 'Units label shown below the value in each cell (e.g., "MIN")',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	fmt: {
		type: String,
		required: false,
		description: 'Format code for the metric value',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	title: {
		type: String,
		required: false,
		description: 'Component title',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	lower_is_better: {
		type: ZodAttribute.create(booleanVariableSchema.optional().default(false)),
		required: false,
		description:
			'If true, low values are green and high values are red. Default (false) means high values are green.',
		affectsQuery: false
	},
	compact: {
		type: ZodAttribute.create(booleanVariableSchema.optional().default(false)),
		required: false,
		description:
			'If true, removes gaps and borders between cells and applies a single border radius to the outer grid.',
		affectsQuery: false
	},
	filters: {
		type: Array,
		required: false,
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'heat_grid',
	category: 'value',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateSqlExpression('dimension', 'data', 'select'),
		ifCondition(notMetric, expressionHasAggregation('value')),
		validateSqlOptions(),
		validateFormatCode('fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display a grid of color-coded cells based on metric thresholds',
	keywords: ['metric grid', 'color grid', 'conditional formatting'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 1,
			minWidth: 300
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% heat_grid
  data="appointments"
  dimension="province"
  value="avg(wait_time)"
  thresholds=[60, 90]
  units="MIN"
  lower_is_better=true
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
