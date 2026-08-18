import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';

type SliderAttributes = UserComponentProps<typeof schema>;

export type SliderValue = number | [number, number];

export class SliderFilter extends Filter<SliderValue> {
	// Override default property to use 'value' for all contexts
	static override defaultProperty = { sql: 'value', text: 'value', column: 'value' };

	attributes: Omit<UserComponentProps<typeof schema>, 'id'>;

	get sql() {
		// Generate SQL for use with filters prop
		const hasValueColumn = !!this.attributes.value_column;

		if (!hasValueColumn) {
			return undefined;
		}

		if (this.attributes.range) {
			// Range mode
			if (Array.isArray(this.value) && this.value.length === 2) {
				return `${this.attributes.value_column} BETWEEN ${this.value[0]} AND ${this.value[1]}`;
			}
			return undefined;
		} else {
			// Single value mode
			if (typeof this.value === 'number') {
				return `${this.attributes.value_column} >= ${this.value}`;
			}
			return undefined;
		}
	}

	get templateValues() {
		const templateValues: Record<string, unknown> = {};
		const hasValueColumn = !!this.attributes.value_column;

		if (this.attributes.range) {
			// Range mode: expose min, max, value, filter, and between
			if (Array.isArray(this.value) && this.value.length === 2) {
				templateValues.value = this.value;
				templateValues.min = this.value[0];
				templateValues.max = this.value[1];

				// .between - SQL fragment for custom column usage
				templateValues.between = `BETWEEN ${this.value[0]} AND ${this.value[1]}`;

				// .filter - complete SQL expression (only when value_column exists)
				if (hasValueColumn) {
					templateValues.filter = `${this.attributes.value_column} BETWEEN ${this.value[0]} AND ${this.value[1]}`;
				} else {
					templateValues.filter = 'true';
				}
			} else {
				templateValues.value = null;
				templateValues.min = null;
				templateValues.max = null;
				templateValues.between = 'true';
				templateValues.filter = 'true';
			}
		} else {
			// Single value mode
			if (typeof this.value === 'undefined' || this.value === null) {
				templateValues.value = null;
				templateValues.literal = null;
				if (hasValueColumn) {
					templateValues.filter = 'true';
				}
			} else if (typeof this.value === 'number') {
				templateValues.value = this.value;
				templateValues.literal = this.value;

				// .filter - complete SQL expression (only when value_column exists)
				if (hasValueColumn) {
					templateValues.filter = `${this.attributes.value_column} >= ${this.value}`;
				}
			} else {
				// Invalid state - should not happen
				templateValues.value = null;
				templateValues.literal = null;
				if (hasValueColumn) {
					templateValues.filter = 'true';
				}
			}
		}

		return templateValues;
	}

	constructor(init: FilterInit<'slider', SliderAttributes>, deps: FilterDeps) {
		let processedInitialValue: SliderValue | undefined;

		if (init.attributes.range) {
			// Range mode: expect array [min, max]
			if (Array.isArray(init.attributes.initial_value)) {
				if (init.attributes.initial_value.length === 2) {
					const min =
						typeof init.attributes.initial_value[0] === 'number'
							? init.attributes.initial_value[0]
							: Number(init.attributes.initial_value[0]);
					const max =
						typeof init.attributes.initial_value[1] === 'number'
							? init.attributes.initial_value[1]
							: Number(init.attributes.initial_value[1]);
					if (!isNaN(min) && !isNaN(max)) {
						processedInitialValue = [min, max] as [number, number];
					}
				}
			}
		} else {
			// Single value mode: expect number
			if (typeof init.attributes.initial_value === 'number') {
				processedInitialValue = init.attributes.initial_value;
			} else if (
				Array.isArray(init.attributes.initial_value) &&
				init.attributes.initial_value.length === 1
			) {
				// Allow single-element array for convenience
				const val =
					typeof init.attributes.initial_value[0] === 'number'
						? init.attributes.initial_value[0]
						: Number(init.attributes.initial_value[0]);
				if (!isNaN(val)) {
					processedInitialValue = val;
				}
			}
		}

		super(
			init.id,
			init.userComponentName,
			{
				initialValue: processedInitialValue,
				serialize: (value) => {
					if (value === undefined || value === null) return undefined;
					if (Array.isArray(value)) {
						// Use "min - max" format for range mode
						return `${value[0]} - ${value[1]}`;
					}
					return String(value);
				},
				deserialize: (raw) => {
					if (!raw) return undefined;
					// Check if it's a range (format: "min - max")
					if (raw.includes(' - ')) {
						const parts = raw.split(' - ');
						if (parts.length === 2) {
							const min = Number(parts[0].trim());
							const max = Number(parts[1].trim());
							if (!isNaN(min) && !isNaN(max)) {
								return [min, max] as [number, number];
							}
						}
					}
					// Also support comma format for backwards compatibility
					if (raw.includes(',')) {
						const parts = raw.split(',');
						if (parts.length === 2) {
							const min = Number(parts[0].trim());
							const max = Number(parts[1].trim());
							if (!isNaN(min) && !isNaN(max)) {
								return [min, max] as [number, number];
							}
						}
					}
					// Single value
					const num = Number(raw);
					return isNaN(num) ? undefined : num;
				}
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}
}
