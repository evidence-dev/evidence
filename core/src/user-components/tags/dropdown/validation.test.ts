import { describe, expect, it } from 'vitest';
import { isDropdownValueValid } from './validation';

describe('isDropdownValueValid', () => {
	const value = 'primary_care';
	const availableValues = new Set(['primary_care', 'womens_health', 'eap']);

	it('keeps value while query has not loaded yet (no options, no static options)', () => {
		// While the options query is still in flight, `optionsQuery.result` is undefined,
		// so `hasQueryResults` is false. We must NOT clear the user's URL/initial
		// value during this transient state.
		expect(
			isDropdownValueValid(value, new Set(), {
				hasQueryResults: false,
				hasStaticOptions: false
			})
		).toBe(true);
	});

	it('keeps value when options query errored or returned no rows', () => {
		// On first paint in PDF mode, the options
		// query can transiently return an empty/error result before reactivity
		// settles. Without this guard, the value gets cleared and `select_first`
		// picks an arbitrary default.
		expect(
			isDropdownValueValid(value, new Set(), {
				hasQueryResults: true,
				hasStaticOptions: false
			})
		).toBe(true);
	});

	it('keeps value when a parent filter has not yet hydrated and the inline query SQL errored', () => {
		// Cascading-parent repro:
		//
		//   {% dropdown id="granularity" select_first=true ... /%}
		//   {% dropdown id="category"    select_first=true
		//      data="demo_daily_orders_aggregated"     <-- depends on {{granularity.selected}}
		//      /%}
		//
		// In PDF mode with the URL set to ?category=Bicycles (no `granularity`
		// param), `granularity` has no value at first paint, so
		// `{{granularity.selected}}` interpolates to ''. The child query
		// becomes `date_trunc('', date)`, which errors and resolves the
		// options query with an empty rows array. We must NOT clear the
		// `category` value at that point — once `granularity`'s `select_first`
		// settles on a default and the child query re-runs, the original URL
		// value should still be intact.
		expect(
			isDropdownValueValid('Bicycles', new Set(), {
				hasQueryResults: true,
				hasStaticOptions: false
			})
		).toBe(true);
	});

	it('keeps value when it matches an available option', () => {
		expect(
			isDropdownValueValid(value, availableValues, {
				hasQueryResults: true,
				hasStaticOptions: false
			})
		).toBe(true);
	});

	it('clears value when query returned non-empty options that do not include the value', () => {
		// The genuine "stale selection" case — typically caused by cascading
		// dropdowns where a parent filter invalidates this dropdown's options.
		const optionsWithoutValue = new Set(['womens_health', 'eap']);
		expect(
			isDropdownValueValid(value, optionsWithoutValue, {
				hasQueryResults: true,
				hasStaticOptions: false
			})
		).toBe(false);
	});

	it('respects static options (children/options prop) even without a query', () => {
		expect(
			isDropdownValueValid('not_in_static', new Set(['a', 'b']), {
				hasQueryResults: false,
				hasStaticOptions: true
			})
		).toBe(false);
	});

	it('keeps empty/undefined values without inspecting options', () => {
		expect(
			isDropdownValueValid(undefined, availableValues, {
				hasQueryResults: true,
				hasStaticOptions: false
			})
		).toBe(true);
		expect(
			isDropdownValueValid('', availableValues, {
				hasQueryResults: true,
				hasStaticOptions: false
			})
		).toBe(true);
	});
});
