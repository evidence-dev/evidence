import type { UserComponentSchema } from '../../types';
import { validateEmptyAttributes } from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { availableIconNames } from '../../common/icon-names';

export const schema = {
	render: 'text_input',
	category: 'input',
	description: 'A text input field that can be used in filters',
	keywords: ['text field', 'search box', 'text box'],
	attributes: {
		id: {
			type: String,
			description: 'The id of the text input to be used in a `filters` prop',
			required: true,
			affectsQuery: false
		},
		title: {
			type: String,
			description: 'Text displayed above the input',
			required: false,
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
		icon: {
			type: String,
			description: 'Icon to display in the input field',
			required: false,
			matches: [...availableIconNames],
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		placeholder: {
			type: String,
			description: 'Placeholder text displayed when the input is empty',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		initial_value: {
			type: String,
			description: 'Initial value for the text input',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		...WIDTH_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'value',
			defaultFor: ['sql', 'text', 'column'],
			description: 'Returns the text input value, escaped for safe use in SQL.',
			noSelectionValue: '',
			singleValue: 'search term',
			example: `{% text_input id="search_term" /%}

\`\`\`sql filtered_products
select * from products
where product_name ILIKE '%{{search_term}}%'
\`\`\``
		}
	],
	validate: validateEmptyAttributes(),
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
			title: 'Using `where`',
			hero: true,
			example: `
{% text_input
    id="search"
    title="Search"
    placeholder="Enter search term..."
/%}

{% table
    data="demo.daily_orders"
    where="category ilike '%{{search}}%'"
/%}
`
		},
		{
			title: 'Using Inline SQL',
			example: `
{% text_input
    id="search"
    title="Search"
    placeholder="Enter search term..."
/%}

\`\`\`sql search_results
select * from demo.daily_orders
[[where category ilike '%{{search}}%']]
\`\`\`

{% table data="search_results" /%}
`
		}
	]
} as const satisfies UserComponentSchema;
