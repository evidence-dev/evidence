import type { UserComponentSchema } from '../../types';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { validateDefaultAgainstPresets } from '../../validators';
import { COMPARISON_VALUES } from '../../common/comparison-schema';

export const schema = {
	render: 'comparison_selector',
	category: 'input',
	description: 'Display a selector for comparison options to use in SQL query templates',
	keywords: [
		'period over period',
		'year over year',
		'prior period',
		'prior year',
		'comparison',
		'time comparison',
		'date comparison',
		'compare periods'
	],
	attributes: {
		id: {
			type: String,
			description: 'The id of the comparison selector to be used in SQL query templates',
			required: true,
			affectsQuery: false
		},
		preset_values: {
			type: Array,
			description:
				'Optional array of preset comparison values to show. If not provided, all comparison options will be available.',
			required: false,
			suggestionType: 'comparison',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		default_value: {
			type: String,
			description: 'Default comparison to select on load',
			required: false,
			matches: Array.from(COMPARISON_VALUES),
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		title: {
			type: String,
			description: 'Text displayed above the selector',
			required: false,
			default: 'Comparison',
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
			default: 'triangle',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		...WIDTH_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'selected',
			description:
				'Returns the selected comparison value with quotes. Returns an empty string when no value is selected.',
			noSelectionValue: "''",
			singleValue: "'prior year'",
			example: `{% comparison_selector id="comparison" preset_values=["prior year", "prior period"] /%}

\`\`\`sql sales_comparison
select 
  date,
  sum(sales) as total_sales,
  '{{comparison.selected}}' as comparison_type
from orders
group by date
\`\`\``
		},
		{
			name: 'literal',
			description: 'Returns the raw unescaped selected value.',
			noSelectionValue: '',
			singleValue: 'prior year',
			example: `{% comparison_selector id="comparison" preset_values=["prior year", "prior period"] /%}

\`\`\`sql sales_comparison
select 
  date,
  sum(sales) as total_sales,
  {{comparison.literal}} as comparison_type
from orders
group by date
\`\`\``
		},
		{
			name: 'compare_vs',
			description: 'Returns the comparison type.',
			singleValue: 'prior year'
		},
		{
			name: 'comparison',
			defaultFor: ['sql', 'text', 'column'],
			description:
				'Returns the full comparison configuration as JSON. Use `{{comp}}` directly with `compare_vs` to dynamically configure comparisons.',
			singleValue: '{"compare_vs": "prior year"}',
			example: `{% comparison_selector id="comp" /%}

{% big_value 
    data="demo.daily_orders"
    value="sum(total_sales)"
    comparison={ compare_vs={{comp}} }
/%}`
		},
		{
			name: 'agg',
			description: 'For benchmark comparisons: returns the aggregation function.',
			singleValue: 'avg'
		},
		{
			name: 'subject',
			description: 'For benchmark comparisons: returns the subject column that defines entities.',
			singleValue: 'region'
		},
		{
			name: 'target',
			description: 'For target comparisons: returns the target value or expression.',
			singleValue: '100000'
		}
	],
	validate: validateDefaultAgainstPresets({
		defaultAttrs: 'default_value',
		presetsAttr: 'preset_values',
		errorId: 'default-not-in-presets',
		displayName: 'default_value'
	}),
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
	allowedChildren: ['benchmark_comparison', 'target_comparison'],
	examples: [
		{
			title: 'Using `comparison`',
			hero: true,
			example: `
{% comparison_selector
    id="comp"
    default_value="prior year"
/%}

{% big_value
    data="demo.daily_orders"
    value="sum(total_sales)"
    fmt="usd1m"
    date_range={
        date="date"
        range="last 12 months"
    }
    comparison={
        compare_vs={{comp}}
    }
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
