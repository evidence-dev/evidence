import type { Validator } from './types';

export const startsWith =
	(attributeName: string, startsWith: string): Validator =>
	(node) => {
		const attributeValue = node.attributes[attributeName];

		if (typeof attributeValue !== 'string') return [];

		if (attributeValue.startsWith(startsWith)) return [];

		return [
			{
				id: 'invalid-start',
				level: 'error',
				message: `\`${attributeName}\` must start with \`${startsWith}\``,
				location: node.location
			}
		];
	};
