import type { Validator } from '../../../../validators';

/** This validator is used to make sure the `x`/`y`/... attributes are strings and not numbers when `data` is provided */
export const isStringNotNumber =
	(attributeName: string): Validator =>
	(node) => {
		const attributeValue = node.attributes[attributeName];

		if (typeof attributeValue === 'number') {
			return [
				{
					id: 'invalid-attribute-type',
					level: 'error',
					message: `Attribute '${attributeName}' must be type of 'String'`,
					location: node.location
				}
			];
		}

		return [];
	};
