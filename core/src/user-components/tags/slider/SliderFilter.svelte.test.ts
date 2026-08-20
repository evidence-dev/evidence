// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { SliderFilter } from './SliderFilter.svelte';

function makeSlider(attributes: Record<string, unknown> = {}) {
	return new SliderFilter({ id: 'amount', userComponentName: 'slider', attributes } as never, {
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: undefined
	});
}

describe('SliderFilter.predicateSql', () => {
	it('emits a BETWEEN predicate in range mode', () => {
		const filter = makeSlider({ value_column: 'amount', range: true });
		filter.setDefault([10, 20]);
		expect(filter.predicateSql()).toBe('amount BETWEEN 10 AND 20');
		// The `.sql` back-compat getter delegates to predicateSql.
		expect(filter.sql).toBe('amount BETWEEN 10 AND 20');
	});

	it('emits a >= predicate in single-value mode', () => {
		const filter = makeSlider({ value_column: 'amount' });
		filter.setDefault(5);
		expect(filter.predicateSql()).toBe('amount >= 5');
		expect(filter.sql).toBe('amount >= 5');
	});

	it('contributes no predicate without a value_column', () => {
		const filter = makeSlider({ range: true });
		filter.setDefault([10, 20]);
		expect(filter.predicateSql()).toBeUndefined();
		expect(filter.sql).toBeUndefined();
	});

	it('contributes no predicate in range mode until both bounds are set', () => {
		const filter = makeSlider({ value_column: 'amount', range: true });
		filter.setDefault(10);
		expect(filter.predicateSql()).toBeUndefined();
	});
});
