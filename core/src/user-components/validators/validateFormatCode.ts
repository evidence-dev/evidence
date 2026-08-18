import { containsVariableSyntax, type Validator } from './types';
import { ALL_FORMAT_OPTIONS } from '../formatValue';

export const validateFormatCode =
	(attributeName: string): Validator =>
	(node) => {
		const attributeValue = node.attributes[attributeName];

		// If no value provided, skip validation
		if (!attributeValue) return [];

		// Only validate string values
		if (typeof attributeValue !== 'string') return [];

		// Skip validation if value contains variable syntax - value unknown until runtime
		if (containsVariableSyntax(attributeValue)) return [];

		// Check if the format code is in the comprehensive list (includes both specific formats and base auto formats)
		if (ALL_FORMAT_OPTIONS.includes(attributeValue)) return [];

		// Return warning if format code is not in built-in list
		return [
			{
				id: 'custom-format-code',
				level: 'warning',
				message: `${attributeValue} is not in the list of built-in formats. Consider checking the built-in list before using a custom format. Note that custom formats must follow Excel-style format codes.`,
				location: node.location
			}
		];
	};
