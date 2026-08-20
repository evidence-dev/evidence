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

// XOR: raw mode wants (data + numerator + denominator + dimension); metric mode
// keeps the author's numerator + dimension but takes `data` from the metric
// view's base and defaults `denominator` to the metric's aggregate (so the
// author only writes the numerator's specialization on top).
const dataSources = [
	{ requires: ['data', 'numerator', 'denominator', 'dimension'], forbids: ['metric'] },
	{ requires: ['metric', 'numerator', 'dimension'], forbids: ['data'] }
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
		description: 'Column for row labels (e.g., provider_type)',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	numerator: {
		type: String,
		required: true,
		suggestionType: 'sql',
		description: 'SQL aggregation for the filled portion (e.g., count(*) FILTER (WHERE active))',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	denominator: {
		type: String,
		required: false,
		suggestionType: 'sql',
		description:
			'SQL aggregation for the total (e.g., count(*)). Omitted in metric mode — the metric supplies the default denominator (its own aggregate).',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	fmt: {
		type: String,
		required: false,
		description: 'Format code for numerator and denominator values',
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
	colors: {
		type: ZodAttribute.create(z.tuple([z.string(), z.string()]).optional()),
		required: false,
		description:
			'Two-color array defining the gradient for bars and badges, e.g. ["#ef4444", "#22c55e"]. First color maps to 0%, second to 100%.',
		affectsQuery: false
	},
	thresholds: {
		type: ZodAttribute.create(z.tuple([z.number(), z.number()]).optional()),
		required: false,
		description:
			'Two percentage thresholds (0-1) creating 3 color zones: red below first, amber between, green above second. e.g. [0.5, 0.8].',
		affectsQuery: false
	},
	lower_is_better: {
		type: ZodAttribute.create(booleanVariableSchema.optional().default(false)),
		required: false,
		description:
			'If true, low percentages are green and high percentages are red. Default (false) means high percentages are green. Only applies when thresholds are set.',
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
	render: 'progress_bars',
	category: 'value',
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		// Raw-mode-only checks. `data`-scoped SQL and denominator-aggregation
		// checks don't apply when the metric supplies both — gate them so a
		// valid metric-driven progress_bars doesn't fail these validators.
		ifCondition(notMetric, tableExists('data')),
		ifCondition(notMetric, validateSqlExpression('numerator', 'data', 'select')),
		ifCondition(notMetric, validateSqlExpression('denominator', 'data', 'select')),
		ifCondition(notMetric, validateSqlExpression('dimension', 'data', 'select')),
		ifCondition(notMetric, expressionHasAggregation('denominator')),
		expressionHasAggregation('numerator'),
		filtersExist('filters'),
		validateSqlOptions(),
		validateFormatCode('fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display progress bars showing a numerator/denominator ratio per category',
	keywords: ['progress', 'percentage bars', 'completion bars', 'gauge'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 1,
			minWidth: 250
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% progress_bars
  data="staff"
  dimension="provider_type"
  numerator="count(*) FILTER (WHERE on_shift = true)"
  denominator="count(*)"
  title="Provider Staffing"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
