import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import { escapeSqlValue } from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';
import type { Option } from '../option/types';

type DropdownAttributes = UserComponentProps<typeof schema> & {
	// Options list passed from the component for label lookup
	_combinedOptions?: Option[];
};

export class DropdownFilter extends Filter<string | string[]> {
	attributes: Omit<DropdownAttributes, 'id'>;

	get sql() {
		if (!this.attributes.value_column) return undefined;

		if (Array.isArray(this.value)) {
			if (this.value.length === 0) return undefined;
			return `${this.attributes.value_column} IN (${this.value.map((v) => `'${escapeSqlValue(String(v), this.dialect)}'`).join(', ')})`;
		}
		if (this.value === undefined || this.value === null || this.value === '') return undefined;
		return `${this.attributes.value_column}='${escapeSqlValue(String(this.value), this.dialect)}'`;
	}

	// Helper to look up label from options
	private getLabel(value: string): string {
		const option = this.attributes._combinedOptions?.find((opt) => opt.value === value);
		return option?.label ?? value;
	}

	// Helper to look up fmt from options
	private getFmt(value: string): string | undefined {
		const option = this.attributes._combinedOptions?.find((opt) => opt.value === value);
		return option?.fmt;
	}

	get templateValues() {
		// Generate template values for dropdown
		const templateValues: Record<string, unknown> = {};

		if (Array.isArray(this.value)) {
			if (this.value.length === 0) {
				templateValues.selected = '';
				templateValues.filter = 'true';
				templateValues.literal = '';
				templateValues.label = '';
				templateValues.fmt = undefined;
			} else {
				templateValues.selected = `(${this.value.map((v) => `'${escapeSqlValue(String(v), this.dialect)}'`).join(', ')})`;
				// Only include column reference in filter if value_column exists
				if (this.attributes.value_column) {
					templateValues.filter = `${this.attributes.value_column} IN (${this.value.map((v) => `'${escapeSqlValue(String(v), this.dialect)}'`).join(', ')})`;
				} else {
					templateValues.filter = 'true';
				}
				templateValues.literal = this.value.join(', ');
				// For multiple values, return comma-separated labels
				templateValues.label = this.value.map((v) => this.getLabel(v)).join(', ');
				// For multiple values, use first value's fmt (or undefined if none)
				templateValues.fmt = this.value.length > 0 ? this.getFmt(this.value[0]) : undefined;
			}
		} else if (this.value === undefined || this.value === null || this.value === '') {
			templateValues.selected = '';
			templateValues.filter = 'true';
			templateValues.literal = '';
			templateValues.label = '';
			templateValues.fmt = undefined;
		} else {
			templateValues.selected = `'${escapeSqlValue(String(this.value), this.dialect)}'`;
			// Only include column reference in filter if value_column exists
			if (this.attributes.value_column) {
				templateValues.filter = `${this.attributes.value_column}='${escapeSqlValue(String(this.value), this.dialect)}'`;
			} else {
				templateValues.filter = 'true';
			}
			templateValues.literal = this.value;
			// Look up label from options
			templateValues.label = this.getLabel(this.value);
			// Look up fmt from options
			templateValues.fmt = this.getFmt(this.value);
		}

		return templateValues;
	}

	constructor(init: FilterInit<'dropdown', DropdownAttributes>, deps: FilterDeps) {
		let processedInitialValue: string | string[] | undefined;
		const rawInitial = init.attributes.initial_value;
		if (init.attributes.multiple) {
			if (Array.isArray(rawInitial)) {
				processedInitialValue = rawInitial
					.filter((x) => typeof x === 'string' || typeof x === 'number')
					.map(String);
			} else if (rawInitial != null) {
				processedInitialValue = [String(rawInitial)];
			} else {
				processedInitialValue = undefined;
			}
		} else {
			if (Array.isArray(rawInitial) && rawInitial.length > 0) {
				processedInitialValue = String(rawInitial[0]);
			} else if (rawInitial != null && !Array.isArray(rawInitial)) {
				processedInitialValue = String(rawInitial);
			} else {
				processedInitialValue = undefined;
			}
		}

		super(
			init.id,
			init.userComponentName,
			{
				initialValue: processedInitialValue,
				serialize: (value) => {
					if (!value || (Array.isArray(value) && !value.length)) return undefined;
					if (Array.isArray(value)) return JSON.stringify(value);
					return value;
				},
				deserialize: (raw) => {
					if (raw.startsWith('[')) {
						try {
							const parsed = JSON.parse(raw);
							if (
								Array.isArray(parsed) &&
								parsed.every((v) => typeof v === 'string')
							)
								return parsed;
						} catch {
							// Not valid JSON array — fall through to raw string
						}
					}
					// Backwards compat: handle legacy JSON-quoted strings
					if (raw.startsWith('"') && raw.endsWith('"')) {
						try {
							const parsed = JSON.parse(raw);
							if (typeof parsed === 'string') return parsed;
						} catch {
							// Not valid JSON — fall through to raw string
						}
					}
					return raw;
				}
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}
}
