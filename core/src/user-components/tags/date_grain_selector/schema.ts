import type { UserComponentSchema } from '../../types';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { DATE_GRAINS } from '../../common/date-options';
import { and, containsVariableSyntax, validateDefaultAgainstPresets } from '../../validators';

export const schema = {
	render: 'date_grain_selector',
	category: 'input',
	description: 'Display a selector for date grain options to use in SQL query templates',
	keywords: [
		'date grain',
		'time grain',
		'date bucket',
		'date interval',
		'date truncate',
		'date grouping',
		'time period',
		'day week month year',
		'date aggregation'
	],
	attributes: {
		id: {
			type: String,
			description: 'The id of the date grain selector to be used in SQL query templates',
			required: true,
			affectsQuery: false
		},
		preset_values: {
			type: Array,
			description:
				'Optional array of preset date grain values to show. If not provided, all date grain options will be available.',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		default_value: {
			type: String,
			description: 'Default date grain to select on load',
			required: false,
			matches: Array.from(DATE_GRAINS),
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		title: {
			type: String,
			description: 'Text displayed above the selector',
			required: false,
			default: 'Date Grain',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		info: {
			type: String,
			description: 'Information tooltip text',
			required: false,
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
		placeholder: {
			type: String,
			description: 'Placeholder text displayed when no value is selected',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		icon: {
			type: String,
			description: 'Icon to display',
			required: false,
			default: 'clock',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		...WIDTH_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'selected',
			defaultFor: ['sql'],
			description:
				'Returns the selected date grain value with quotes. Returns an empty string when no value is selected.',
			noSelectionValue: "''",
			singleValue: "'month'",
			example: `{% date_grain_selector id="grain" preset_values=["day", "week", "month"] /%}

\`\`\`sql sales_by_grain
select 
  toStartOf{{grain.selected}}(date) as period,
  sum(sales) as total_sales
from orders
group by period
\`\`\``
		},
		{
			name: 'literal',
			defaultFor: ['text', 'column'],
			description:
				'Returns the raw unescaped selected value. Use this with the `date_grain` attribute.',
			noSelectionValue: '',
			singleValue: 'month',
			example: `{% date_grain_selector id="grain" preset_values=["day", "week", "month"] /%}

\`\`\`sql sales_by_grain
select 
  {{grain.literal}} as period,
  sum(sales) as total_sales
from orders
group by period
\`\`\``
		}
	],
	validate: and(
		validateDefaultAgainstPresets({
			defaultAttrs: 'default_value',
			presetsAttr: 'preset_values',
			errorId: 'default-not-in-presets',
			displayName: 'default_value'
		}),
		// The selector only emits a grain it recognizes, so anything else here is dropped from the
		// dropdown. Say so at author time rather than letting the option quietly go missing.
		(node) => {
			const presets = node.attributes.preset_values;
			if (!Array.isArray(presets)) return [];
			const unknown = presets.filter(
				(v) => typeof v === 'string' && !containsVariableSyntax(v) && !DATE_GRAINS.includes(v)
			);
			if (unknown.length === 0) return [];
			return [
				{
					id: 'unknown-preset-grain',
					level: 'warning' as const,
					message: `preset_values ${unknown.map((v) => `"${v}"`).join(', ')} ${unknown.length > 1 ? 'are' : 'is'} not a date grain and will not be offered. Valid grains: ${Array.from(DATE_GRAINS).join(', ')}.`,
					location: node.location
				}
			];
		}
	),
	isFilterInput: true,
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'fit',
		flex: {
			grow: 1,
			minWidth: 200,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Using `date_grain`',
			hero: true,
			example: `
{% date_grain_selector
    id="time_grain"
    default_value="month"
/%}

{% line_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    date_grain={{time_grain}}
/%}
`
		},
		{
			title: 'Using Inline SQL',
			example: `
{% date_grain_selector
    id="time_grain"
    default_value="month"
/%}

\`\`\`sql sales_by_period
select 
    date_trunc({{time_grain}}, date) as period,
    sum(total_sales) as total_sales
from demo.daily_orders
group by 1
order by 1
\`\`\`

{% line_chart
    data="sales_by_period"
    x="period"
    y="total_sales"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
