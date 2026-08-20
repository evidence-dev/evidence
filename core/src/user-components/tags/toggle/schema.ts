import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'toggle',
	category: 'input',
	description: 'Display a toggle switch that outputs true/false values for use in filters',
	keywords: ['switch', 'boolean input', 'checkbox'],
	attributes: {
		id: {
			type: String,
			description: 'The id of the toggle to be used in a `filters` prop',
			required: true,
			affectsQuery: false
		},
		label: {
			type: String,
			description:
				'Text displayed next to the toggle inside the box. Defaults to the id if not provided.',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		info: {
			type: String,
			description: 'Information tooltip text that appears after the label',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		invert: {
			type: Boolean,
			description:
				'Invert the boolean value output. When true, checked = false and unchecked = true. Useful when toggle label semantics are opposite to the filter logic (e.g., a "Show inactive" toggle that filters for is_active = false when checked).',
			required: false,
			default: false,
			affectsQuery: false
		},
		initial_value: {
			type: Boolean,
			description: 'Initial state of the toggle',
			required: false,
			default: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		}
	},
	filterProperties: [
		{
			name: 'value',
			defaultFor: ['sql', 'text', 'column'],
			description: 'Returns the boolean value of the toggle.',
			singleValue: 'true',
			example: `{% toggle id="active_filter" /%}

\`\`\`sql active_users
select * from users
where is_active = {{active_filter}}
\`\`\``
		}
	],
	validate: () => [],
	allowedChildren: [],
	isFilterInput: true,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% toggle
    id="show_legend"
    label="Show Legend"
/%}
`
		},
		{
			title: 'Using `where`',
			example: `
{% toggle
    id="active_only"
    label="Active Only"
/%}

{% table
    data="demo.daily_orders"
    where="{{active_only}} = false or total_sales > 1000"
/%}
`
		},
		{
			title: 'Using Inline SQL',
			example: `
{% toggle
    id="active_only"
    label="Active Only"
/%}

\`\`\`sql filtered_orders
select * from demo.daily_orders
where {{active_only}} = false or total_sales > 1000
\`\`\`

{% table data="filtered_orders" /%}
`
		}
	],
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'full',
		flex: {
			grow: 0,
			minWidth: 10,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	}
} as const satisfies UserComponentSchema;
