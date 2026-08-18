import type { Validator } from './types';
import type { ValidationError } from '@markdoc/markdoc';

/**
 * Generic validator that ensures a default value is included in a presets list when presets are specified
 *
 * @param config.defaultAttrs - Attribute name(s) for the default value (supports fallback via array like ['default_range', 'defaultRange'])
 * @param config.presetsAttr - Attribute name for the presets list
 * @param config.errorId - Unique error ID for this validation
 * @param config.displayName - Human-readable name for error messages
 * @returns Validator function
 */
export const validateDefaultAgainstPresets = ({
	defaultAttrs,
	presetsAttr,
	errorId,
	displayName
}: {
	defaultAttrs: string | string[];
	presetsAttr: string;
	errorId: string;
	displayName: string;
}): Validator => {
	return (node, _config, _context) => {
		const errors: ValidationError[] = [];

		// Support both single attribute name and array of fallback names
		const attrs = Array.isArray(defaultAttrs) ? defaultAttrs : [defaultAttrs];
		const defaultValue = attrs.reduce((acc, attr) => acc ?? node.attributes[attr], undefined);
		const presetsList = node.attributes[presetsAttr];

		// Only validate if both presets list is provided and default value is specified
		if (Array.isArray(presetsList) && presetsList.length > 0 && defaultValue) {
			// Check if default value is in the presets list
			if (!presetsList.includes(defaultValue)) {
				errors.push({
					id: errorId,
					level: 'error',
					message: `${displayName} "${defaultValue}" must be included in ${presetsAttr} list: [${presetsList.map((p) => `"${p}"`).join(', ')}]`,
					location: node.location
				});
			}
		}

		return errors;
	};
};
