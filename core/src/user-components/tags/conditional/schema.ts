import type { UserComponentSchema } from '../../types';

export const schema = {
	selfClosing: false,
	render: 'conditional',
	category: 'ui',
	attributes: {},
	componentWrapper: false,
	allowedChildren: ['if', 'else_if', 'else'],
	undocumented: true
} as const satisfies UserComponentSchema;
