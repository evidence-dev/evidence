/**
 * Cross-filter regression test for null-clearing semantics.
 *
 * String-valued builtin filters (dropdown, button_group, input_tabs, text_input)
 * historically only treated `undefined` and `''` as "no value". Author code
 * inside an {% html %} block reasonably uses `null` to clear a filter — JSON
 * serializes "absent" as null, and the SDK passes the value straight through.
 *
 * Pre-fix, `evidence.filters.set("foo", null)` left the filter holding `null`,
 * whose `sql` getter emitted `column='null'` (the literal string), matching
 * zero rows and going blank instead of showing all data. The fix treats null
 * the same as undefined/'' in the empty check.
 *
 * One file covering all four classes because the bug is the same shape in
 * each and we want a single place to add another class if it ever ships with
 * the same pattern.
 */

import { describe, it, expect } from 'vitest';
import type { FilterDeps } from '../../Filter.svelte';
import { DropdownFilter } from './dropdown/DropdownFilter.svelte';
import { ButtonGroupFilter } from './button_group/ButtonGroupFilter.svelte';
import { InputTabsFilter } from './input_tabs/InputTabsFilter.svelte';
import { TextInputFilter } from './text_input/TextInputFilter.svelte';

const deps: FilterDeps = {
	url: undefined,
	updateUrl: undefined,
	projectSettings: undefined,
	dialect: undefined
};

type AnyFilter = {
	value: unknown;
	sql: string | undefined;
	templateValues: Record<string, unknown>;
};

function setValue(filter: AnyFilter, value: unknown) {
	filter.value = value;
}

describe('builtin filters treat null as "no value" (cleared)', () => {
	it('DropdownFilter: null produces no sql predicate and no filter expression', () => {
		const filter = new DropdownFilter(
			{
				id: 'cat',
				userComponentName: 'dropdown',
				attributes: { value_column: 'category', multiple: false }
			} as unknown as ConstructorParameters<typeof DropdownFilter>[0],
			deps
		) as unknown as AnyFilter;

		setValue(filter, 'a');
		expect(filter.sql).toBe("category='a'");

		setValue(filter, null);
		expect(filter.sql).toBeUndefined();
		expect(filter.templateValues.selected).toBe('');
		expect(filter.templateValues.filter).toBe('true');
	});

	it('ButtonGroupFilter: null produces no sql predicate', () => {
		const filter = new ButtonGroupFilter(
			{
				id: 'cat',
				userComponentName: 'button_group',
				attributes: { value_column: 'category' }
			} as unknown as ConstructorParameters<typeof ButtonGroupFilter>[0],
			deps
		) as unknown as AnyFilter;

		setValue(filter, 'a');
		expect(filter.sql).toBe("category='a'");

		setValue(filter, null);
		expect(filter.sql).toBeUndefined();
		expect(filter.templateValues.selected).toBe('');
		expect(filter.templateValues.filter).toBe('true');
	});

	it('InputTabsFilter: null produces no sql predicate', () => {
		const filter = new InputTabsFilter(
			{
				id: 'cat',
				userComponentName: 'input_tabs',
				attributes: { value_column: 'category' }
			} as unknown as ConstructorParameters<typeof InputTabsFilter>[0],
			deps
		) as unknown as AnyFilter;

		setValue(filter, 'a');
		expect(filter.sql).toBe("category='a'");

		setValue(filter, null);
		expect(filter.sql).toBeUndefined();
		expect(filter.templateValues.selected).toBe('');
		expect(filter.templateValues.filter).toBe('true');
	});

	it('TextInputFilter: null renders as empty value (no String("null") leakage)', () => {
		const filter = new TextInputFilter(
			{
				id: 'q',
				userComponentName: 'text_input',
				attributes: {}
			} as unknown as ConstructorParameters<typeof TextInputFilter>[0],
			deps
		) as unknown as AnyFilter;

		setValue(filter, 'hello');
		expect(filter.templateValues.value).toBe('hello');

		setValue(filter, null);
		expect(filter.templateValues.value).toBe('');
	});
});
