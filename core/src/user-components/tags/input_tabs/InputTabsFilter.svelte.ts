import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import { escapeSqlValue } from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';
import type { Option } from '../option/types';

type InputTabsAttributes = UserComponentProps<typeof schema> & {
	// Options list passed from the component for label lookup
	_combinedOptions?: Option[];
};

export class InputTabsFilter extends Filter<string> {
	attributes: Omit<InputTabsAttributes, 'id'>;

	get sql() {
		if (!this.attributes.value_column) return undefined;
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
		// Generate template values for input tabs
		const templateValues: Record<string, unknown> = {};

		if (this.value === undefined || this.value === null || this.value === '') {
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

	constructor(init: FilterInit<'input_tabs', InputTabsAttributes>, deps: FilterDeps) {
		let processedInitialValue: string | undefined;

		// Always single selection
		if (
			Array.isArray(init.attributes.initial_value) &&
			typeof init.attributes.initial_value[0] === 'string'
		) {
			processedInitialValue = init.attributes.initial_value[0];
		} else if (typeof init.attributes.initial_value === 'string') {
			processedInitialValue = init.attributes.initial_value;
		} else {
			processedInitialValue = undefined;
		}

		super(
			init.id,
			init.userComponentName,
			{
				initialValue: processedInitialValue,
				serialize: (value) => {
					if (!value) return undefined;
					return value;
				},
				deserialize: (raw) => {
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
