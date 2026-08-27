import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'delta_defaults',
	category: 'ui',
	description: 'Sets default delta formatting options (such as down_is_good) for all child components',
	attributes: {
		down_is_good: {
			type: Boolean,
			description: 'Whether downward trends are considered positive by default for child components',
			default: undefined
		},
		downIsGood: {
			type: Boolean,
			description: 'Alias for down_is_good',
			default: undefined
		}
	},
	selfClosing: false,
	componentWrapper: {
		display: 'contents',
		noCard: true
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
<!-- Invert delta coloring for all child KPI components (cost dashboard) -->
{% delta_defaults down_is_good=true %}
    {% big_value data="costs" value="total_cloud_cost" /%}
    {% big_value data="costs" value="total_infra_cost" /%}
{% /delta_defaults %}
`
		}
	]
} as const satisfies UserComponentSchema;
