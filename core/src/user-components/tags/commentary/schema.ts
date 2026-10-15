import { z } from 'zod';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { ZodAttribute } from '../../common/zod-attribute';
import type { UserComponentSchema } from '../../types';
import { and } from '../../validators';
import { isValidationContext, type Validator } from '../../validators/types';
import { validateEmail } from '../../validators/validateEmail';
import { commentaryScopeError, parseCommentaryScope } from './commentary-scope';

const validateScope: Validator = (node, _config, context) => {
	if (!isValidationContext(context) || !context.filters) return [];
	const message = commentaryScopeError(
		parseCommentaryScope(node.attributes.scope),
		context.filters
	);
	return message
		? [{ id: 'invalid-commentary-scope', level: 'error', message, location: node.location }]
		: [];
};

const attributes = {
	id: {
		type: String,
		required: true,
		description: 'Unique identifier for the commentary component'
	},
	scope: {
		type: ZodAttribute.create(z.union([z.string(), z.array(z.string())])),
		required: false,
		default: 'page',
		description:
			'What the commentary is kept for: `page` (one for the whole page), `period` (one per reporting period; requires `workflow.period` in the frontmatter), an input id, or a list such as `["period", "fund"]` (one per combination of selected values). Inputs must be single-select: dropdown, button_group, input_tabs, toggle or period_selector.'
	},
	placeholder: {
		type: String,
		required: false,
		description: 'Placeholder text to show when the commentary is empty'
	},
	className: {
		type: String,
		required: false,
		description: 'Additional CSS classes to apply to the component'
	},
	allowedEditors: {
		type: Array,
		required: false,
		description: 'Emails of allowed commentary editors'
	},
	title: {
		type: String,
		required: false,
		description: 'Title to display above the commentary'
	},
	hideEditMetadata: {
		type: String,
		required: false,
		description: 'When to hide the edit metadata',
		matches: ['always', 'never', 'print'],
		default: 'print'
	},
	style: {
		type: String,
		required: false,
		description: 'Style of the commentary',
		matches: ['quote', 'normal'],
		default: 'normal'
	},
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'commentary',
	category: 'ui',
	selfClosing: true,
	description: 'Allows users to input commentary to be saved with the page',
	attributes: attributes,
	validate: and(validateEmail('allowedEditors'), validateScope),
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true,
		flex: {
			grow: 3,
			minWidth: 250
		}
	},
	examples: [
		{
			title: 'Page-wide commentary',
			hero: true,
			example: '{% commentary id="overview" /%}'
		},
		{
			title: 'Reporting-period commentary',
			example: '{% commentary id="monthly-review" scope="period" /%}'
		},
		{
			title: 'Commentary per period and input',
			example: `{% dropdown id="category" data="demo.daily_orders" value_column="category" select_first=true /%}

{% commentary id="category-review" scope=["period", "category"] /%}`
		}
	]
} as const satisfies UserComponentSchema;
