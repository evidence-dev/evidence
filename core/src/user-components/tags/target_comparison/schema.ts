import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'target_comparison',
	category: 'input',
	description: 'Define a custom target comparison option for a comparison_selector',
	selfClosing: true,
	attributes: {
		name: {
			type: String,
			description: 'Display name shown in the dropdown (e.g., "vs Budget")',
			required: true
		},
		target: {
			type: String,
			description:
				'Target value for comparison. Can be a column name, aggregation (e.g., "sum(budget)"), or literal value.',
			required: true,
			suggestionType: 'sql'
		},
		// Display properties
		display_type: {
			type: String,
			description:
				'Default display type for this comparison. Options: pct (percentage change), abs (absolute change), compared_value (target value)',
			required: false,
			matches: ['pct', 'abs', 'compared_value']
		},
		text: {
			type: String,
			description: 'Custom comparison label text (overrides default "vs {name}")',
			required: false
		},
		pct_fmt: {
			type: String,
			description: 'Format code for percentage values',
			required: false,
			suggestionType: 'format'
		},
		abs_fmt: {
			type: String,
			description: 'Format code for absolute values',
			required: false,
			suggestionType: 'format'
		},
		down_is_good: {
			type: Boolean,
			description: 'If true, negative changes are shown as positive (green)',
			required: false,
			default: false
		}
	},
	componentWrapper: {
		display: 'inline'
	},
	allowedParents: ['comparison_selector'],
	examples: [
		{
			title: 'Compare vs Budget',
			hero: true,
			example: `
{% target_comparison 
    name="vs Budget" 
    target="budget_amount"
/%}
`
		},
		{
			title: 'Compare vs Fixed Goal',
			example: `
{% target_comparison 
    name="vs 100K Goal" 
    target="100000"
/%}
`
		},
		{
			title: 'Compare vs Aggregated Target',
			example: `
{% target_comparison 
    name="vs Target" 
    target="sum(target_sales)"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
