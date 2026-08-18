import type { UserComponentSchema } from '../../types';
import {
	and,
	filtersExist,
	tableExists,
	validateDateAttributes,
	validateDateRange,
	validateSqlExpression,
	validateSqlOptions,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	metricExists
} from '../../validators';
import { ifCondition } from '../../validators/ifCondition';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import { DATE_RANGE_ATTRIBUTE, DATE_GRAIN_ATTRIBUTE } from '../../common/date-options';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import { METRIC_ATTRIBUTE } from '../../common/metric-attribute';
import type { Validator } from '../../validators/types';

/** True when the component is NOT in metric mode (i.e. uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

/**
 * A sparkline is driven EITHER by a `metric` (`x` may be omitted to inherit the
 * view's time column) OR by `data` + `x` + `y` (the raw path). Mirrors the
 * corresponding validator on `big_value`.
 */
const validSource: Validator = (node) => {
	const a = node.attributes ?? {};
	if (a.metric) {
		if (a.data || a.y) {
			return [
				{
					id: 'metric-and-data',
					level: 'error',
					message: 'Use `metric` on its own — not together with `data`/`y`.',
					location: node.location
				}
			];
		}
		return [];
	}
	if (!a.data || !a.x || !a.y) {
		return [
			{
				id: 'missing-source',
				level: 'error',
				message: 'Set a `metric`, or `data` + `x` + `y`.',
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
	x: {
		type: String,
		required: false,
		suggested: true,
		description: 'Column for x-axis (often date/time). Omit to use the metric view time column.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	y: {
		type: String,
		required: false,
		suggested: true,
		description: 'Column for y-axis (values to plot). Omit when using `metric`.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	type: {
		type: String,
		required: false,
		default: 'line',
		matches: ['line', 'area', 'bar'],
		description: 'Type of sparkline to display',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	color: {
		type: String,
		required: false,
		description: 'Color of the sparkline (CSS color)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	y_fmt: {
		type: String,
		required: false,
		description: 'Format for y-axis tooltip (e.g., "num", "usd", "pct")',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	x_fmt: {
		type: String,
		required: false,
		description: 'Format for x-axis tooltip (e.g., "shortdate", "longdate")',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	fit_to_data: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Whether to scale the y-axis to the data range',
		affectsQuery: false
	},
	interactive: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Whether the sparkline should be interactive',
		affectsQuery: false
	},
	filters: {
		type: Array,
		required: false,
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	// Include all SQL options and date filtering options
	...SQL_OPTIONS,
	...REFRESH_INTERVAL_ATTRIBUTE,
	...DATE_RANGE_ATTRIBUTE,
	...DATE_GRAIN_ATTRIBUTE,
	...WIDTH_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'sparkline',
	category: 'chart_slot',
	validate: and(
		validSource,
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		validateDateAttributes(),
		validateDateRange(),
		// Raw-path SQL checks only apply when not driven by `metric` (metric mode
		// resolves x/y from the view, so there's no `data` to validate against).
		ifCondition(notMetric, validateSqlExpression('x', 'data', 'select')),
		ifCondition(notMetric, validateSqlExpression('y', 'data', 'select')),
		validateSqlOptions(),
		validateFormatCode('y_fmt'),
		validateFormatCode('x_fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description:
		'Display a small sparkline chart. To add sparklines to a table, use the measure component with the viz="sparkline" option.',
	keywords: ['inline chart', 'micro chart', 'mini chart'],
	attributes,
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% sparkline
	data="demo.daily_orders"
	y="total_sales"
	x="date"
	date_grain="month"
	date_range={
		date="date"
		range="last 12 months"
	}
/%}
`
		},
		{
			title: 'Semantic metric',
			example: `
{% sparkline metric="revenue" /%}
`
		},
		{
			title: 'Sparkline with Color',
			example: `
{% sparkline
    data="demo.daily_orders"
    y="total_sales"
    x="date"
    color="blue"
/%}
`
		},
		{
			title: 'Sparkline with Type',
			example: `
{% sparkline
    data="demo.daily_orders"
    y="total_sales"
    x="date"
    type="area"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
