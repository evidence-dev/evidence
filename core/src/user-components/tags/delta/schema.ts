import type { UserComponentSchema } from '../../types';
import {
	and,
	filtersExist,
	tableExists,
	columnsExistInTable,
	validateDateAttributes,
	validateDateRange,
	validateComparison,
	validateBenchmarkProperties,
	validateSqlOptions,
	validateSqlExpression,
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
import type { Validator } from '../../validators/types';
import { z } from 'zod';

const comparisonSchema = baseComparisonSchema
	.extend({
		down_is_good: z
			.boolean({
				description: 'Whether a downward trend is considered positive'
			})
			.optional()
			.default(false)
	})
	.optional();

/** True when the component is NOT in metric mode (i.e. uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

/**
 * A delta is driven EITHER by a `metric` (the whole reference) OR by
 * `data` + `value` (the raw path) — not both, not neither. Mirrors the
 * corresponding validator on `big_value`.
 */
const validSource: Validator = (node) => {
	const a = node.attributes ?? {};
	if (a.metric) {
		if (a.data || a.value) {
			return [
				{
					id: 'metric-and-data',
					level: 'error',
					message: 'Use `metric` on its own — not together with `data`/`value`.',
					location: node.location
				}
			];
		}
		return [];
	}
	if (!a.data || !a.value) {
		return [
			{
				id: 'missing-source',
				level: 'error',
				message: 'Set a `metric`, or both `data` and `value`.',
				location: node.location
			}
		];
	}
	return [];
};

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
	text: {
		type: String,
		required: false,
		description: 'Text appearing after the delta (e.g., vs. prev month)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	chip: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Whether to display as a chip',
		affectsQuery: false
	},
	comparison: {
		type: ZodAttribute.create(comparisonSchema),
		required: false,
		default: undefined,
		description: 'Comparison configuration object',
		affectsQuery: true
	},
	show_value: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Whether to show the value',
		affectsQuery: false
	},
	show_symbol: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Whether to show the delta symbol',
		affectsQuery: false
	},
	symbol_position: {
		type: String,
		required: false,
		default: 'right',
		matches: ['left', 'right'],
		description: 'Position of the delta symbol relative to the value',
		affectsQuery: false
	},
	neutral_range: {
		type: Array,
		required: false,
		default: [0, 0],
		description:
			'Range [min, max] for neutral values. Use null for infinity (e.g., [null, 0] means anything ≤ 0 is neutral)',
		affectsQuery: false
	},
	filters: {
		type: Array,
		required: false,
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	// Include SQL options and date attributes
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...DATE_RANGE_ATTRIBUTE,
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'delta',
	category: 'value',
	keywords: ['change', 'difference', 'variance', 'comparison'],
	validate: and(
		validSource,
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
		validateFormatCode('fmt'),
		validateFormatCode('comparison.abs_fmt'),
		validateFormatCode('comparison.pct_fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display an inline delta value with an up/down indicator',
	attributes,
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% delta
	data="demo.daily_orders"
	value="sum(total_sales)"
	comparison={
		compare_vs="target"
		target="120000000"
	}
/%}
`
		},
		{
			title: 'Semantic metric',
			example: `
{% delta metric="revenue" comparison={ compare_vs="prior year" } /%}
`
		}
	]
} as const satisfies UserComponentSchema;
