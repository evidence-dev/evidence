import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import { escapeSqlValue } from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';

type TextInputAttributes = UserComponentProps<typeof schema>;

export class TextInputFilter extends Filter<string> {
	// Override default property to use 'value' for all contexts
	static override defaultProperty = { sql: 'value', text: 'value', column: 'value' };

	attributes: Omit<UserComponentProps<typeof schema>, 'id'>;

	get sql() {
		// Text input doesn't generate SQL filters directly
		// Users will use the value property in their WHERE clauses
		return undefined;
	}

	get templateValues() {
		// Return the value property - this is what users will reference
		const templateValues: Record<string, unknown> = {};

		if (this.value === undefined || this.value === null || this.value === '') {
			templateValues.value = '';
		} else {
			// Pre-escaped so authors can drop it straight into a literal: WHERE name ILIKE '%{{search}}%'
			templateValues.value = escapeSqlValue(this.value, this.dialect);
		}

		return templateValues;
	}

	constructor(init: FilterInit<'text_input', TextInputAttributes>, deps: FilterDeps) {
		const processedInitialValue = init.attributes.initial_value || undefined;

		super(
			init.id,
			init.userComponentName,
			{
				initialValue: processedInitialValue,
				serialize: (value) => {
					if (!value || value === '') return undefined;
					return value;
				},
				deserialize: (raw) => raw
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}
}
