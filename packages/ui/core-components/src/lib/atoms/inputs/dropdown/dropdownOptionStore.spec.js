/**
 * @jest-environment jsdom
 */

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

	describe('destruction', () => {
		it('should not add options after destruction', async () => {
			const { addOptions, destroy, options } = dropdownOptionStore();
			destroy();
			addOptions({ value: 1, label: 'test' });
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(0);
		});
		it('should not remove options after destruction', async () => {
			const { addOptions, removeOptions, destroy, options } = dropdownOptionStore();
			const opt = { value: 1, label: 'test' };
			addOptions(opt);
			await vi.advanceTimersByTimeAsync(100);
			destroy();
			removeOptions(opt);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(1);
		});
		it('should not select options after destruction', async () => {
			const { addOptions, toggleSelected, destroy, options } = dropdownOptionStore({
				noDefault: true
			});
			const opt = { value: 1, label: 'test' };
			addOptions(opt);
			await vi.advanceTimersByTimeAsync(100);
			destroy();
			toggleSelected(opt);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)[0].selected).toBe(false);
		});
	});
	// TODO: Undefined Options
	describe('initialization', () => {
		describe('select all by default', () => {
			it('should select the options in the first call of addOptions', async () => {
				const { addOptions, options } = dropdownOptionStore({
					selectAllByDefault: true,
					multiselect: true
				});
				addOptions({ value: 1, label: 'test' }, { value: 2, label: 'test' });
				await vi.advanceTimersByTimeAsync(100);
				addOptions({ value: 3, label: 'test' });
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toHaveLength(3);
				expect(get(options)[0].selected).toBe(true);
				expect(get(options)[1].selected).toBe(true);
				expect(get(options)[2].selected).toBe(false);
			});
			it('should not select the first call if an initial state is passed', async () => {
				const initial = [
					{ value: 1, label: 'test' },
					{ value: 2, label: 'test' }
				];

				const { addOptions, options } = dropdownOptionStore({
					selectAllByDefault: true,
					multiselect: true,
					initialOptions: initial
				});
				addOptions({ value: 3, label: 'test' });
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toHaveLength(3);
				expect(get(options)[0].selected).toBeFalsy();
				expect(get(options)[1].selected).toBeFalsy();
				expect(get(options)[2].selected).toBeFalsy();
			});
			it('should not interfere with any selections in initial state', async () => {
				const initial = [
					{ value: 1, label: 'test', selected: true },
					{ value: 2, label: 'test' }
				];

				const { options } = dropdownOptionStore({
					selectAllByDefault: true,
					multiselect: true,
					initialOptions: initial
				});

				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toHaveLength(2);
				expect(get(options)[0].selected).toBe(true);
				expect(get(options)[1].selected).toBeFalsy();
			});
		});
		describe('initial state', () => {
			it('should initialize with an empty array', async () => {
				const { options } = dropdownOptionStore({ noDefault: true });
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toHaveLength(0);
			});
			it('should accept initial options', async () => {
				const { options } = dropdownOptionStore({
					noDefault: true,
					initialOptions: [{ value: 1, label: 'test' }]
				});

				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toHaveLength(1);
			});
			it('should allow selections to exist in the initial options', async () => {
				const { selectedOptions } = dropdownOptionStore({
					noDefault: true,
					initialOptions: [
						{
							value: 1,
							label: 'test',
							selected: true
						}
					]
				});

				await vi.advanceTimersByTimeAsync(100);
				expect(get(selectedOptions).length).toBe(1);
			});
			it('should perform hygene on the initial options', async () => {
				const { options } = dropdownOptionStore({
					noDefault: true,
					initialOptions: [
						{
							value: 1,
							label: 'test'
						},
						{
							value: 0,
							label: 'test'
						}
					]
				});

				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0].value).toBe(0);
			});
			it('should not make a default selection if the initial options include a selected option', async () => {
				const { addOptions, options } = dropdownOptionStore({
					initialOptions: [
						{
							value: 1,
							label: 'should be selected',
							selected: true
						}
					]
				});
				addOptions({ value: 0, label: 'test' });
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0].label).toBe('should be selected');
				expect(get(options)[0].selected).toBe(true);
				expect(get(options)[1].selected).toBe(false);
			});
		});
		describe('default selections', () => {
			it('should select the first option by default for single-selects', async () => {
				const { addOptions, options } = dropdownOptionStore();
				addOptions(
					{
						value: 1,
						label: 'test'
					},
					{
						value: 0,
						label: 'test'
					}
				);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0].selected).toBe(true);
			});
			it('should not select the first option by default for multiselect', async () => {
				const { addOptions, options } = dropdownOptionStore({ multiselect: true });
				addOptions(
					{
						value: 1,
						label: 'test'
					},
					{
						value: 0,
						label: 'test'
					}
				);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0].selected).toBe(false);
			});
			it('should select options as they are added if their values are in defaultValues (multiselect)', async () => {
				const { addOptions, options } = dropdownOptionStore({
					defaultValues: [1, 2, 3],
					multiselect: true
				});
				addOptions(
					{
						value: 1,
						label: 'test'
					},
					{
						value: 2,
						label: 'test'
					},
					{
						value: 3,
						label: 'test'
					}
				);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options).every((v) => v.selected)).toBe(true);
			});
			it('should only select the first default value if multiselect is false', async () => {
				const { addOptions, options } = dropdownOptionStore({
					defaultValues: [1, 2, 3],
					multiselect: false
				});
				addOptions(
					{
						value: 1,
						label: 'test'
					},
					{
						value: 2,
						label: 'test'
					},
					{
						value: 3,
						label: 'test'
					}
				);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0].selected).toBe(true);
				expect(get(options)[1].selected).toBe(false);
				expect(get(options)[2].selected).toBe(false);
			});
		});
	});

	describe('hygiene', () => {
		it('should deduplicate options by value + label', async () => {
			const { addOptions, options } = dropdownOptionStore({ noDefault: true });
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
			it('should be pausable', async () => {
				const { addOptions, options, pauseSorting } = dropdownOptionStore({ noDefault: true });
				const opts = [
					{ value: 3, label: 'test' },
					{ value: 2, label: 'test' },
					{ value: 1, label: 'test' }
				];

				pauseSorting();
				addOptions(...opts);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toStrictEqual(opts);
			});
			it('should sort when resumed', async () => {
				const { addOptions, options, pauseSorting, resumeSorting } = dropdownOptionStore({
					noDefault: true
				});
				const opts = [
					{ value: 3, label: 'test' },
					{ value: 2, label: 'test' },
					{ value: 1, label: 'test' }
				];

				pauseSorting();
				addOptions(...opts);
				await vi.advanceTimersByTimeAsync(100);
				resumeSorting();
				expect(get(options)).toStrictEqual([opts[2], opts[1], opts[0]]);
			});
			it('should sort when paused and forced', async () => {
				const { addOptions, options, pauseSorting, forceSort } = dropdownOptionStore({
					noDefault: true
				});
				const opts = [
					{ value: 3, label: 'test' },
					{ value: 2, label: 'test' },
					{ value: 1, label: 'test' }
				];

				pauseSorting();
				addOptions(...opts);
				await vi.advanceTimersByTimeAsync(100);
				forceSort();
				expect(get(options)).toStrictEqual([opts[2], opts[1], opts[0]]);
			});

			it('should handle null labels', async () => {
				const { addOptions, options } = dropdownOptionStore({ noDefault: true });
				addOptions({ value: 1, label: 'also not null' });
				addOptions({ value: 2, label: null });
				addOptions({ value: 3, label: null });
				addOptions({ value: 4, label: 'not null' });
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0].label).toBe('also not null');
				expect(get(options)[1].label).toBe('not null');
				expect(get(options)[2].label).toBe(null);
				expect(get(options)[3].label).toBe(null);
			});
			it('should sort labels numerically if they are both numbers', async () => {
				const { addOptions, options } = dropdownOptionStore({ noDefault: true });
				addOptions({ value: 1, label: 10 });
				addOptions({ value: 2, label: 2 });
				addOptions({ value: 3, label: 3 });
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)[0].label).toBe(2);
				expect(get(options)[1].label).toBe(3);
				expect(get(options)[2].label).toBe(10);
			});
			it('should sort labels lexically if they are not all numbers', async () => {
				const { addOptions, options } = dropdownOptionStore({ noDefault: true });
				const opt0 = { value: 1, label: 1 };
				const opt1 = { value: 1, label: '10' };
				const opt2 = { value: 2, label: '2' };
				const opt3 = { value: 3, label: '3' };
				const opt4 = { value: 12, label: '1' };
				const opt5 = { value: 1, label: 2 };
				const opts = shuffle([opt4, opt1, opt2, opt3, opt0, opt5]);
				addOptions(...opts);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toStrictEqual([opt0, opt4, opt1, opt5, opt2, opt3]);
			});
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

				const { addOptions, options } = dropdownOptionStore({ noDefault: true });

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

				const { addOptions, options } = dropdownOptionStore({ noDefault: true });

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

				const { addOptions, options } = dropdownOptionStore({ noDefault: true });

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

				const { addOptions, options } = dropdownOptionStore({ noDefault: true });

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

				const { addOptions, options } = dropdownOptionStore({ noDefault: true });

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

				const { addOptions, options } = dropdownOptionStore({ noDefault: true });
				addOptions(...shuffled);

				await vi.advanceTimersByTimeAsync(100);
				const actual = get(options).map((opt) => opt.label);

				expect(actual).toEqual(expected);
			});
		});
	});

	describe('option management', () => {
		it('should not add non-object options', async () => {
			const { addOptions, options } = dropdownOptionStore({ noDefault: true });
			addOptions(null);
			addOptions(undefined);
			addOptions(false);
			addOptions(1);
			addOptions('Hi!');
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(0);
		});
		it(
			'should add options one at a time',
			async () => {
				const { addOptions, options } = dropdownOptionStore({ noDefault: true });
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
			},
			{ skip: true /* skipped because browserDebounce is disabled */ }
		);
		it(
			'should add 2 options at once',
			async () => {
				const { addOptions, options } = dropdownOptionStore({ noDefault: true });
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
			},
			{ skip: true /* skipped because browserDebounce is disabled */ }
		);
		it(
			'should add a lot of options at once',
			async () => {
				const opts = new Array(100).fill(null).map((_, i) => ({ value: i, label: i.toString() }));
				const { addOptions, options } = dropdownOptionStore({ noDefault: true });
				addOptions(...opts);
				expect(get(options)).toHaveLength(0);
				await vi.advanceTimersByTimeAsync(100);
				expect(get(options)).toHaveLength(100);
			},
			{ skip: true /* skipped because browserDebounce is disabled */ }
		);

		it('should remove an option', async () => {
			const { addOptions, removeOptions, options } = dropdownOptionStore({ noDefault: true });

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
			const {
				addOptions: addOption,
				removeOptions: removeOption,
				options
			} = dropdownOptionStore({ noDefault: true });

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
			const { addOptions: addOption, options } = dropdownOptionStore({ noDefault: true });

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
			multiselect: false,
			noDefault: true
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
		it('should not remove options that were selected, removed, re-added, then unselected', async () => {
			const store = dropdownOptionStore({ ...baseOptions, multiselect: true });
			const opts = [
				{ label: '1', value: 1 },
				{ label: '2', value: 2 }
			];
			store.addOptions(...opts);
			await vi.advanceTimersByTimeAsync(100);

			store.toggleSelected(opts[0]);
			await vi.advanceTimersByTimeAsync(100);

			store.removeOptions(opts[0]);
			await vi.advanceTimersByTimeAsync(100);

			store.addOptions(opts[0]);
			await vi.advanceTimersByTimeAsync(100);

			store.toggleSelected(opts[0]);
			await vi.advanceTimersByTimeAsync(100);

			expect(get(store.options), 'Option should not have been removed').toHaveLength(2);
			expect(get(store.options)[0].selected, 'Option should still be selected').toBe(false);
		});
	});
	describe('multi-select', () => {
		const baseOptions = {
			multiselect: true,
			noDefault: true
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
