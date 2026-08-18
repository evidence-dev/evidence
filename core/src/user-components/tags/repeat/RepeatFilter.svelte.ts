import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import { escapeSqlValue } from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';

// RepeatFilter can be used in two contexts:
// 1. Page-level (for autocomplete/references) - uses Repeat component attributes
// 2. Repeat-context (for actual filtering) - uses RepeatChild attributes with value
type PageLevelAttributes = Omit<UserComponentProps<typeof schema>, 'id'>;
type RepeatContextAttributes = { value: unknown; column: string };
type RepeatFilterAttributes = PageLevelAttributes | RepeatContextAttributes;

export class RepeatFilter extends Filter {
	attributes: RepeatFilterAttributes;

	// Check if this is a repeat-context filter (has value) vs page-level filter
	private get hasValue(): boolean {
		return 'value' in this.attributes && this.attributes.value !== undefined;
	}

	get sql() {
		if (!this.hasValue) return undefined;
		const attrs = this.attributes as { value: unknown; column: string };
		if (!attrs.column || !attrs.value) return undefined;
		return `${attrs.column}='${typeof attrs.value === 'string' ? escapeSqlValue(attrs.value, this.dialect) : attrs.value}'`;
	}

	get templateValues() {
		// Generate template values for interpolation
		const templateValues: Record<string, unknown> = {};

		if (!this.hasValue) {
			// Page-level filter without a value yet (used for autocomplete)
			templateValues.selected = '';
			templateValues.filter = 'true';
			templateValues.literal = '';
		} else {
			const attrs = this.attributes as { value: unknown; column: string };
			if (typeof attrs.value === 'undefined' || attrs.value === null) {
				templateValues.selected = '';
				templateValues.filter = 'true';
				templateValues.literal = '';
			} else {
				const escapedValue =
					typeof attrs.value === 'string' ? escapeSqlValue(attrs.value, this.dialect) : attrs.value;
				templateValues.selected = `'${escapedValue}'`;
				templateValues.filter = `${attrs.column}='${escapedValue}'`;
				templateValues.literal = attrs.value;
			}
		}

		return templateValues;
	}

	constructor(
		init: FilterInit<'repeat', PageLevelAttributes | RepeatContextAttributes>,
		deps: FilterDeps
	) {
		// Extract initial value if this is a repeat-context filter
		const initialValue = 'value' in init.attributes ? init.attributes.value : undefined;

		super(
			init.id,
			init.userComponentName,
			{
				initialValue,
				dontUseQueryParam: true,
				serialize: (value) => JSON.stringify(value),
				deserialize: (raw) => JSON.parse(raw)
			},
			deps
		);
		this.attributes = $state(init.attributes as RepeatFilterAttributes);
	}
}
