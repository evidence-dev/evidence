import type { UserComponentSchema } from '../../types';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';

export const schema = {
	render: 'metric_card',
	category: 'component',
	description:
		'All-in-one responsive KPI metric card combining BigValue, Sparkline trend line, and Delta badge',
	keywords: [
		'metric card',
		'stat card',
		'kpi card',
		'big value card',
		'metric',
		'stat',
		'card'
	],
	attributes: {
		data: {
			type: String,
			required: false,
			suggested: true,
			suggestionType: 'table',
			description: 'Data source table or query',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		value: {
			type: [String, Number],
			required: false,
			suggested: true,
			suggestionType: 'column',
			description: 'Column name or numerical value to display',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		value_fmt: {
			type: String,
			required: false,
			description: 'Format string for the primary value (e.g. usd, eur, pct, num0)',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		title: {
			type: String,
			required: false,
			description: 'Title displayed at the top of the card',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		subtitle: {
			type: String,
			required: false,
			description: 'Subtitle displayed below the title',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		info: {
			type: String,
			required: false,
			description: 'Tooltip info text displayed next to the title',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		comparison: {
			type: [String, Number],
			required: false,
			description: 'Comparison value, target, or column name to compute delta from',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		comparison_text: {
			type: String,
			required: false,
			description: 'Label displayed beside the comparison delta (e.g. "vs. prior period")',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		comparison_fmt: {
			type: String,
			required: false,
			description: 'Format string for comparison delta (defaults to pct)',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		down_is_good: {
			type: Boolean,
			required: false,
			default: false,
			description: 'Whether a decrease in the metric is positive (green)',
			affectsQuery: false
		},
		badge: {
			type: Boolean,
			required: false,
			default: true,
			description: 'Whether to display the delta as a styled trend pill badge',
			affectsQuery: false
		},
		sparkline_date: {
			type: String,
			required: false,
			description: 'Date or time column for the sparkline trend',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		sparkline_value: {
			type: String,
			required: false,
			description: 'Value column for the sparkline (defaults to the primary value column)',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		sparkline_type: {
			type: String,
			required: false,
			default: 'line',
			description: 'Sparkline chart type: "line", "area", or "bar"',
			affectsQuery: false
		},
		sparkline_color: {
			type: String,
			required: false,
			description: 'Custom hex color or theme token for the sparkline',
			affectsQuery: false
		},
		link: {
			type: String,
			required: false,
			description: 'Optional URL to navigate to when clicking the card',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		filters: {
			type: Array,
			required: false,
			suggestionType: 'filter',
			affectsQuery: true
		},
		...DATE_RANGE_ATTRIBUTE,
		...SQL_OPTIONS,
		...REFRESH_INTERVAL_ATTRIBUTE,
		...WIDTH_ATTRIBUTE
	}
} as const satisfies UserComponentSchema;
