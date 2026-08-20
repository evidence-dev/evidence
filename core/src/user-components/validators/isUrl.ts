import type { Validator } from './types';
import { isSafeExternalUrl } from '../common/transform-internal-link';

export const isUrl =
	(attributeName: string): Validator =>
	(node) => {
		const attributeValue = node.attributes[attributeName];

		if (typeof attributeValue !== 'string') return [];

		if (isSafeExternalUrl(attributeValue)) return [];

		return [
			{
				id: 'invalid-url',
				level: 'error',
				// Names the schemes: `ftp://files.example.com` is a perfectly valid URL, so
				// "must be a valid URL" leaves the author with no idea why it was rejected.
				message: `\`${attributeName}\` must be an http, https, mailto, or tel URL`,
				location: node.location
			}
		];
	};
