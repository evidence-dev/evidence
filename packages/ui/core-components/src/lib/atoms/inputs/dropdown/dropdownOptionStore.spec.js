import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dropdownOptionStore } from './dropdownOptionStore.js';
import { get } from 'svelte/store';
import shuffle from 'lodash/shuffle';

describe('dropdownOptionStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	// TODO this seems counter-intuitive, should we realy enable selecting an option that doesnt exist yet?
	// Seems like this should be handled via default values
	it.skip('should select an option after it is added', async () => {
		const {
			addOptions: addOption,
			toggleSelected: select,
			selectedOptions
		} = dropdownOptionStore();

		const opts = [
			{ label: '1', value: 1 },
			{ label: '2', value: 2 },
			{ label: '3', value: 3 }
		];

		select(opts[0]);
		opts.forEach((i) => addOption(i));
		await vi.advanceTimersByTimeAsync(100);
		expect(get(selectedOptions).length).toBe(1);
	});

	describe('hygiene', () => {
		it('should deduplicate options by value + label', async () => {
			const { addOptions, options } = dropdownOptionStore();
			addOptions({
				value: 1,
				label: 'test'
			});
			addOptions({
				value: 1,
				label: 'test'
			});

			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(1);
		});

		describe('Sorting', () => {
			it('should put selected options above all other options', async () => {
				const opt1 = {
					value: 1,
					label: 'test',
					selected: false,
					__auto: false
				};
				const opt2 = {
					value: 2,
					label: 'test',
					selected: true
				};
				const opt3 = {
					value: 3,
					label: 'test',
					selected: false,
					__auto: true
				};

				const { addOptions, options } = dropdownOptionStore();

				addOptions(opt1, opt2, opt3);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0]).toEqual(opt2);
			});
			it('should put manual options above automatic options', async () => {
				const opt1 = {
					value: 1,
					label: 'test',
					__auto: true
				};
				const opt2 = {
					value: 2,
					label: 'test',
					__auto: false
				};

				const { addOptions, options } = dropdownOptionStore();

				addOptions(opt1, opt2);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toEqual([opt2, opt1]);
			});
			it('should sort selected options by index', async () => {
				const opt1 = {
					value: 2,
					label: 'test',
					idx: 2
				};
				const opt2 = {
					value: 2,
					label: 'test 2',
					idx: 1
				};

				const { addOptions, options } = dropdownOptionStore();

				addOptions(opt1, opt2);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toEqual([opt2, opt1]);
			});
			it('should sort by label when index is the same', async () => {
				const opt1 = {
					value: 2,
					label: 'test 2',
					idx: 2
				};
				const opt2 = {
					value: 3,
					label: 'test',
					idx: 2
				};

				const { addOptions, options } = dropdownOptionStore();

				addOptions(opt1, opt2);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toEqual([opt2, opt1]);
			});
			it('should sort by value when index + label are the same', async () => {
				const opt1 = {
					value: 2,
					label: 'test',
					idx: 2
				};
				const opt2 = {
					value: 0,
					label: 'test',
					idx: 2
				};

				const { addOptions, options } = dropdownOptionStore();

				addOptions(opt1, opt2);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toEqual([opt2, opt1]);
			});
			it('should properly sort a combination of different options', async () => {
				/* <Selected> */
				// Selected, Manual
				const opt1 = {
					label: '1',
					selected: true,
					__auto: false,
					idx: 0,
					value: 1
				};
				// Selected, Auto
				const opt2 = { ...opt1, label: '2', __auto: true };
				// Selected, Auto, Sort by Index
				const opt3 = { ...opt2, label: '3', idx: 1 };
				// Selected, Auto, Index, Sort by Label
				const opt4 = { ...opt3, label: '4' };
				// Selected, Auto, Index, Label, Sort by Value
				const opt5 = { ...opt4, label: '5', value: 3 };
				/* </Selected> */

				/* <Not Selected, Not Auto> */
				// Not Automatic, floats to the top
				const opt6 = {
					label: '6',
					selected: false,
					__auto: false,
					idx: 0,
					value: 1
				};
				// Selected, Auto, Sort by Index
				const opt7 = { ...opt6, label: '7', idx: 1 };
				// Selected, Auto, Index, Sort by Label
				const opt8 = { ...opt7, label: '8' };
				// Selected, Auto, Index, Label, Sort by Value
				const opt9 = { ...opt8, label: '9', value: 3 };
				/* </Not Selected, Not Auto> */

				/* <Not Selected, Auto> */
				// Not Automatic, floats to the top
				const opt10 = {
					label: '10',
					selected: false,
					__auto: true,
					idx: 0,
					value: 1
				};
				// Selected, Auto, Sort by Index
				const opt11 = { ...opt10, label: '11', idx: 1 };
				// Selected, Auto, Index, Sort by Label
				const opt12 = { ...opt11, label: '12' };
				// Selected, Auto, Index, Label, Sort by Value
				const opt13 = { ...opt12, label: '13', value: 3 };
				/* </Not Selected, Auto> */

				const allOptions = [
					opt1,
					opt2,
					opt3,
					opt4,
					opt5,
					opt6,
					opt7,
					opt8,
					opt9,
					opt10,
					opt11,
					opt12,
					opt13
				];
				const expected = allOptions.map((opt) => opt.label);
				const shuffled = shuffle(allOptions);

				const { addOptions, options } = dropdownOptionStore();
				addOptions(...shuffled);

				await vi.advanceTimersByTimeAsync(100);
				const actual = get(options).map((opt) => opt.label);

				expect(actual).toEqual(expected);
			});
		});
	});

	describe('option management', () => {
		it('should add options one at a time', async () => {
			const { addOptions, options } = dropdownOptionStore();
			addOptions({
				value: 1,
				label: 'test'
			});
			addOptions({
				value: 2,
				label: 'test'
			});
			expect(get(options)).toHaveLength(0);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(2);
		});
		it('should add 2 options at once', async () => {
			const { addOptions, options } = dropdownOptionStore();
			addOptions(
				{
					value: 1,
					label: 'test'
				},
				{
					value: 2,
					label: 'test'
				}
			);
			expect(get(options)).toHaveLength(0);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(2);
		});
		it('should add a lot of options at once', async () => {
			const opts = new Array(100).fill(null).map((_, i) => ({ value: i, label: i.toString() }));
			const { addOptions, options } = dropdownOptionStore();
			addOptions(...opts);
			expect(get(options)).toHaveLength(0);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(100);
		});

		it('should remove an option', async () => {
			const { addOptions, removeOptions, options } = dropdownOptionStore();

			addOptions({
				value: 1,
				label: 'test'
			});
			removeOptions({
				value: 1,
				label: 'test'
			});

			expect(get(options)).toHaveLength(0);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(0);
		});

		it('should remove options', async () => {
			const { addOptions: addOption, removeOptions: removeOption, options } = dropdownOptionStore();

			addOption({
				value: 1,
				label: 'test'
			});
			removeOption({
				value: 1,
				label: 'test'
			});

			expect(get(options)).toHaveLength(0);
			await vi.advanceTimersByTimeAsync(100);

			const $options = get(options);

			expect($options).toHaveLength(0);
		});
		it('should apply option defaults', async () => {
			const { addOptions: addOption, options } = dropdownOptionStore();

			addOption({
				value: 1,
				label: 'test'
			});

			await vi.advanceTimersByTimeAsync(100);
			const $options = get(options);
			expect($options[0]).toEqual({
				value: 1,
				label: 'test',
				idx: -1,
				__auto: false,
				selected: false
			});
		});
	});

	describe('single-select', () => {
		const baseOptions = {
			multiselect: false
		};
		it('should allow you to select an option', async () => {
			const { addOptions, toggleSelected, selectedOptions } = dropdownOptionStore(baseOptions);
			const opt = { value: 1, label: 'test' };
			const opt2 = { value: 2, label: 'test' };

			addOptions(opt);
			addOptions(opt2);

			toggleSelected(opt);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(selectedOptions).map((v) => ({ label: v.label, value: v.value }))).toEqual([
				{ value: opt.value, label: opt.label }
			]);
		});

		it('should not remove options that are selected', async () => {
			const store = dropdownOptionStore(baseOptions);
			const opts = [
				{ label: '1', value: 1 },
				{ label: '2', value: 2 }
			];

			// Select option
			store.addOptions(...opts);
			store.toggleSelected(opts[0]);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(store.options)[0].selected, 'Option should exist and be selected').toBe(true);

			// Try to remove selected option
			store.removeOptions(opts[0]);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(store.options), 'Option should not have been removed').toHaveLength(2);
			expect(get(store.options)[0].selected, 'Option should still be selected').toBe(true);

			// Select other option, original selection should now be removed
			store.toggleSelected(opts[1]);
			await vi.advanceTimersByTimeAsync(100);
			expect(
				get(store.options),
				'Option should have been removed when it was deselected'
			).toHaveLength(1);
		});
	});
	describe('multi-select', () => {
		const baseOptions = {
			multiselect: true
		};
		it('should allow you to select an option', async () => {
			const { addOptions, toggleSelected, selectedOptions } = dropdownOptionStore(baseOptions);
			const opt = { value: 1, label: 'test1' };
			const opt2 = { value: 2, label: 'test2' };

			addOptions(opt);
			addOptions(opt2);

			toggleSelected(opt);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(selectedOptions).map((v) => ({ label: v.label, value: v.value }))).toEqual([
				{ value: opt.value, label: opt.label }
			]);
		});

		it('should allow you to deselect an option', async () => {
			const { addOptions, toggleSelected, selectedOptions } = dropdownOptionStore(baseOptions);
			const opt = { value: 1, label: 'test' };
			const opt2 = { value: 2, label: 'test' };

			addOptions(opt);
			addOptions(opt2);

			// TODO: Identify behavior when the same option is toggled within the same "tick"
			toggleSelected(opt);
			await vi.advanceTimersByTimeAsync(100);
			toggleSelected(opt);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(selectedOptions).map((v) => ({ label: v.label, value: v.value }))).toEqual([]);
		});

		it('should not remove options that are selected', async () => {
			const store = dropdownOptionStore(baseOptions);
			const opts = [{ label: '1', value: 1 }];

			// Select option
			store.addOptions(opts[0]);
			store.toggleSelected(opts[0]);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(store.options)[0].selected, 'Option should exist and be selected').toBe(true);

			// Try to remove selected option
			store.removeOptions(opts[0]);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(store.options), 'Option should not have been removed').toHaveLength(1);
			expect(get(store.options)[0].selected, 'Option should still be selected').toBe(true);

			// Deselect option, should now be removed
			store.toggleSelected(opts[0]);
			await vi.advanceTimersByTimeAsync(100);
			expect(
				get(store.options),
				'Option should have been removed when it was deselected'
			).toHaveLength(0);
		});
	});
});
