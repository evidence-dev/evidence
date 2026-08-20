import type { Validator } from './types';

export const or =
	(...validators: [Validator, Validator, ...Validator[]]): Validator =>
	(node, config, context) => {
		const errorArrays = validators.map((validator) => validator(node, config, context));

		// If at least one of the validators returned no errors, then `or` is satisfied
		if (errorArrays.some((errorArray) => errorArray.length === 0)) return [];

		const allErrors = errorArrays.flat();

		return [
			{
				id: 'or',
				level: 'error',
				message: allErrors.map((error) => error.message).join('\nor\n'),
				location: node.location
			}
		];
	};
