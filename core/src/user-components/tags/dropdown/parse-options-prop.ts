import { useId } from 'bits-ui';
import type { Option } from '../option/types';

// TODO return ValidationErrors from this to be shown to the user
export const parseOptionsProp = (options: unknown): Option[] => {
	if (!options) return [];
	if (!Array.isArray(options)) return [];
	return options
		.map((option: unknown) => {
			if (option == null) return;
			if (typeof option === 'string' || typeof option === 'number') {
				return {
					id: useId('dropdown-option-from-prop'),
					value: String(option)
				};
			}
			if (typeof option === 'object') {
				const { value, label } = option as { value: unknown; label: unknown };
				if (
					(typeof value !== 'string' && typeof value !== 'number') ||
					(label != null && typeof label !== 'string')
				)
					return;
				return {
					id: useId('dropdown-option-from-prop'),
					value: String(value),
					label: label ?? undefined
				};
			}
		})
		.filter((opt): opt is NonNullable<typeof opt> => Boolean(opt));
};
