import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'benchmark_comparison',
	category: 'input',
	description: 'Define a custom benchmark comparison option for a comparison_selector',
	selfClosing: true,
	attributes: {
		name: {
			type: String,
			description: 'Display name shown in the dropdown (e.g., "vs Franchisees")',
			required: true
		},
		agg: {
			type: String,
			description:
				'Aggregation function to apply across benchmark entities. Options: avg, median, min, max, sum, count, count_distinct',
			required: true,
			matches: ['avg', 'median', 'min', 'max', 'sum', 'count', 'count_distinct']
		},
		subject: {
			type: String,
			description:
				'Column that defines individual entities (e.g., "store_id", "customer_id"). Required for benchmark calculations.',
			required: true,
			suggestionType: 'sql'
		},
		value: {
			type: String,
			description:
				'Optional column or expression to use for benchmark calculation. If not specified, uses the main value column. Useful if you have a pre-aggregated benchmark table for RLS reasons.',
			required: false,
			suggestionType: 'sql'
		},
		where: {
			type: String,
			description:
				'SQL WHERE clause to filter which entities are included in the benchmark (e.g., "ownership_type = \'franchise\'")',
			required: false,
			suggestionType: 'sql'
		},
		within: {
			type: Array,
			description:
				'Dimension columns to group the benchmark by (e.g., ["region"]). Leave empty for dataset-wide benchmark.',
			required: false,
			suggestionType: 'column'
		},
		exclude_self: {
			type: Boolean,
			description:
				'Exclude the current row from its own benchmark calculation (table context only). Default: false',
			required: false,
			default: false
		},
		// Display properties
		display_type: {
			type: String,
			description:
				'Default display type for this comparison. Options: pct (percentage change), abs (absolute change), compared_value (benchmark value)',
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
			title: 'Compare vs Franchisees',
			hero: true,
			example: `
{% benchmark_comparison 
    name="vs Franchisees" 
    agg="avg" 
    subject="store_id"
    where="ownership_type = 'franchise'"
/%}
`
		},
		{
			title: 'Compare vs Full Network',
			example: `
{% benchmark_comparison 
    name="vs Full Network" 
    agg="avg" 
    subject="store_id"
/%}
`
		},
		{
			title: 'Compare vs Region Average',
			example: `
{% benchmark_comparison 
    name="vs Region Avg" 
    agg="avg" 
    subject="store_id"
    within=["region"]
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
