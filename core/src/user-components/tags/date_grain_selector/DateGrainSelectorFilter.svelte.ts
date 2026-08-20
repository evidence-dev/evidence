import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import { escapeSqlValue } from '../../../sql-dialect';
import { DATE_GRAINS } from '../../common/date-options';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';

type DateGrainSelectorAttributes = Omit<UserComponentProps<typeof schema>, 'id'>;

export class DateGrainSelectorFilter extends Filter<string> {
	attributes: DateGrainSelectorAttributes;

	get sql() {
		// Date grain selectors typically don't generate SQL WHERE clauses
		return undefined;
	}

	/**
	 * `literal` is emitted unquoted into author SQL, so escaping this viewer-controlled value
	 * can't save it — only a grain the selector could actually have produced may pass.
	 */
	private get recognizedValue(): string | undefined {
		// Not widened by `preset_values`, which only narrows the UI and supports variables, so
		// another filter's value could otherwise reach it.
		return this.value && DATE_GRAINS.includes(this.value) ? this.value : undefined;
	}

	get templateValues() {
		const value = this.recognizedValue;
		return {
			selected: value ? `'${escapeSqlValue(value, this.dialect)}'` : '',
			literal: value ?? ''
		};
	}

	constructor(
		init: FilterInit<'date_grain_selector', DateGrainSelectorAttributes>,
		deps: FilterDeps
	) {
		const processedInitialValue = init.attributes.default_value;

		super(
			init.id,
			init.userComponentName,
			{
				initialValue: processedInitialValue,
				serialize: (value) => value,
				deserialize: (raw) => (DATE_GRAINS.includes(raw) ? raw : undefined)
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}
}
