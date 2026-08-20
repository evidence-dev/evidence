import type { Validator } from './types';

export const and =
	(...validators: [Validator, Validator, ...Validator[]]): Validator =>
	(node, config, context) => {
		return validators.flatMap((validator) => validator(node, config, context));
	};
