import type { UserComponentSchema } from '../../types';
import { availableIconNames } from '../../common/icon-names';

export const schema = {
	render: 'accordion_item',
	category: 'ui',
	description: 'An accordion item that can be expanded or collapsed.',
	allowedParents: ['accordion'],
	selfClosing: false,
	attributes: {
		title: {
			type: String,
			description:
				'Title displayed in the accordion item header. For rich titles (e.g. containing another component), nest an `accordion_title` tag instead. When both are provided, the nested `accordion_title` takes precedence and this attribute is ignored.',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		icon: {
			type: String,
			description: 'Icon to display in the accordion item header',
			required: false,
			matches: [...availableIconNames],
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		open: {
			type: Boolean,
			description: 'Whether the accordion item is initially open',
			required: false,
			default: false,
			affectsQuery: false
		}
	},
	validate: (node) => {
		// Accept non-string values (e.g. Markdoc Variable objects from `title={$var}`)
		// as "has title" — defer runtime resolution — and only reject empty strings.
		const titleAttr = node.attributes?.title;
		const hasTitleAttr =
			titleAttr != null && (typeof titleAttr !== 'string' || titleAttr.trim() !== '');
		const hasTitleChild = node.children.some(
			(child) => child.type === 'tag' && child.tag === 'accordion_title'
		);
		if (!hasTitleAttr && !hasTitleChild) {
			return [
				{
					id: 'missing-accordion-title',
					level: 'error' as const,
					message:
						'accordion_item requires either a `title` attribute or a nested `accordion_title` component',
					location: node.location
				}
			];
		}
		return [];
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true
	},
	examples: [
		{
			title: 'Accordion with Items',
			hero: true,
			example: `
{% accordion %}
    {% accordion_item title="Section 1" open=true %}
        Content for section 1.
    {% /accordion_item %}
    {% accordion_item title="Section 2" %}
        Content for section 2.
    {% /accordion_item %}
    {% accordion_item title="Section 3" icon="settings" %}
        Content for section 3 with an icon.
    {% /accordion_item %}
{% /accordion %}
`
		}
	]
} as const satisfies UserComponentSchema;
