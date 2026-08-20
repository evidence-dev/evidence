import { isValidationContext, type Validator } from './types';
import { isArrayOf } from './utils/isArrayOf';
import type { ValidationError } from '@markdoc/markdoc';

export const validateEmail =
	(emailAttribute: string): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const emails = node.attributes[emailAttribute];
		if (!isArrayOf(emails, 'string')) return [];

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const errors: ValidationError[] = [];

		emails.forEach((email) => {
			if (!emailRegex.test(email)) {
				errors.push({
					id: 'invalid-email',
					level: 'error',
					message: `Invalid email: ${email}`,
					location: node.location
				});
			}
		});

		return errors;
	};
