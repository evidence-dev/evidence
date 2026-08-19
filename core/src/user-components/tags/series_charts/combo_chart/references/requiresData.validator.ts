import type { Validator } from '../../../../validators';

/** Query-only attributes are silently ignored without `data`, so error instead of rendering wrong output */
export const requiresData =
	(...attributeNames: string[]): Validator =>
	(node) => {
		if (typeof node.attributes.data !== 'undefined') return [];

		return attributeNames
			.filter((name) => {
				const value = node.attributes[name];
				if (typeof value === 'undefined') return false;
				// An empty array is the schema default for `filters`, not an authored value
				return !(Array.isArray(value) && value.length === 0);
			})
			.map((name) => ({
				id: 'invalid-attribute',
				level: 'error' as const,
				message: `Attribute '${name}' requires 'data' to be set`,
				location: node.location
			}));
	};
