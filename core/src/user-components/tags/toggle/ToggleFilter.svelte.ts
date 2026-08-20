import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';

type ToggleAttributes = UserComponentProps<typeof schema>;

export class ToggleFilter extends Filter<boolean> {
	// Override defaults: value for all contexts (only property available)
	static override defaultProperty = { sql: 'value', text: 'value', column: 'value' };

	attributes: Omit<UserComponentProps<typeof schema>, 'id'>;

	get sql() {
		// Toggle doesn't produce SQL filters directly, only template values
		return undefined;
	}

	get templateValues() {
		// Generate template values for toggle
		const templateValues: Record<string, unknown> = {};

		// Ensure value is boolean - default to false if undefined
		let booleanValue = this.value === undefined ? false : this.value;

		// Apply inversion if specified
		if (this.attributes.invert) {
			booleanValue = !booleanValue;
		}

		templateValues.value = booleanValue;

		return templateValues;
	}

	constructor(init: FilterInit<'toggle', ToggleAttributes>, deps: FilterDeps) {
		// Process initial value to ensure it's a boolean
		const processedInitialValue =
			typeof init.attributes.initial_value === 'boolean' ? init.attributes.initial_value : false;

		super(
			init.id,
			init.userComponentName,
			{
				initialValue: processedInitialValue,
				serialize: (value) => {
					if (value === undefined) return undefined;
					return String(value);
				},
				deserialize: (raw) => raw === 'true'
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}
}
