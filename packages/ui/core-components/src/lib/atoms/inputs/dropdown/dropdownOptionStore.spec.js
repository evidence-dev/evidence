import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DropdownValueFlag, dropdownOptionStore } from './dropdownOptionStore.js';
import { get } from 'svelte/store';

describe('dropdownOptionStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
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

	describe.skip('hygeine', () => {
		it('should deduplicate options by value + label', async () => {
			const { addOptions: addOption, options } = dropdownOptionStore();
			addOption({
				value: 1,
				label: 'test'
			});
			addOption({
				value: 1,
				label: 'test'
			});

			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)).toHaveLength(1);
		});

		it('should sort options by idx and value', async () => {
			const { addOptions: addOption, options } = dropdownOptionStore();
			addOption({
				value: 1,
				label: 'A',
				idx: 1
			});
			addOption({
				value: 0,
				label: 'B',
				idx: 0
			});
			addOption({
				value: 2,
				label: 'C',
				idx: 1
			});
			await vi.advanceTimersByTimeAsync(100);

			expect(get(options)[0].label).toBe('B'); // B has index 0
			expect(get(options)[1].label).toBe('A'); // A has index 1, but value is lower than C
			expect(get(options)[2].label).toBe('C');
		});

		it('should keep options sorted by idx and value', async () => {
			const { addOptions: addOption, removeOptions: removeOption, options } = dropdownOptionStore();
			addOption({
				value: 1,
				label: 'A',
				idx: 1
			});
			addOption({
				value: 2,
				label: 'C',
				idx: 1
			});

			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)[0].label).toBe('A');
			expect(get(options)[1].label).toBe('C');
			addOption({
				value: 0,
				label: 'B',
				idx: 0
			});

			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)[0].label).toBe('B');
			expect(get(options)[1].label).toBe('A');
			expect(get(options)[2].label).toBe('C');

			removeOption({
				label: 'A',
				value: 1
			});
			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)[0].label).toBe('B');
			expect(get(options)[1].label).toBe('C');
		});
	});

	it('should not remove options that are selected', async () => {
		const store = dropdownOptionStore();
		const opts = [{ label: '1', value: 1 }];

		// Select option
		store.addOptions(opts[0]);
		store.toggleSelected(opts[0]);
		await vi.advanceTimersByTimeAsync(100);
		expect(get(store.options)[0].selected).toBe(true);

		// Try to remove selected option
		store.removeOptions(opts[0]);
		await vi.advanceTimersByTimeAsync(100);
		expect(get(store.options)).toHaveLength(1);
		expect(get(store.options)[0].selected).toBe(true);

		// Deselect option, should now be removed
		store.toggleSelected(opts[0]);
		await vi.advanceTimersByTimeAsync(100);
		expect(get(store.options)).toHaveLength(0);
	});

	// TODO: Revisit float to top behavior
	describe.skip('removeOnDeselect', () => {
		/*
				The intended behavior is that if a user selects an option
					and then searches for something that would exclude
					the selected option, we should not remove
					the selected option, unless it is deselected by the user
			*/
		it('should not remove removeOnDeselects', async () => {
			const {
				addOptions: addOption,
				removeOptions: removeOption,
				options,
				flagOption,
				toggleSelected: select
			} = dropdownOptionStore();

			const opt = { value: 1, label: 'test' };
			const opt2 = { value: 2, label: 'test' };

			addOption(opt);
			addOption(opt2);
			flagOption([opt, DropdownValueFlag.REMOVE_ON_DESELECT]);
			select(opt);
			await vi.advanceTimersByTimeAsync(100);
			removeOption(opt);
			removeOption(opt2);

			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)[0]).toEqual({
				...opt,
				removeOnDeselect: true,
				selected: true,
				idx: -1
			});
			expect(get(options)).toHaveLength(1);
		});
		it('should float removeOnDeselects to the top', async () => {
			const {
				addOptions: addOption,
				options,
				flagOption,
				toggleSelected: select
			} = dropdownOptionStore();
			const opt = { value: 1, label: 'test', idx: 4 };
			const opt2 = { value: 2, label: 'test', idx: 2 };

			addOption(opt);
			addOption(opt2);

			flagOption([opt, DropdownValueFlag.REMOVE_ON_DESELECT]);
			select(opt);

			await vi.advanceTimersByTimeAsync(100);
			expect(get(options)[0]).toEqual({ ...opt, removeOnDeselect: true, selected: true });
			expect(get(options)[1]).toEqual({ ...opt2, removeOnDeselect: false, selected: false });
		});
		it('should float removeOnDeselects to the top, but below manual options', async () => {
			const {
				addOptions: addOption,
				options,
				flagOption,
				toggleSelected: select
			} = dropdownOptionStore();
			const opt = { value: 1, label: 'test', idx: 4, __auto: true };
			const opt2 = { value: 2, label: 'test', idx: 2, __auto: true };
			const opt3 = { value: 3, label: 'test', idx: -1, __auto: false };

			addOption(opt);
			addOption(opt2);
			addOption(opt3);

			flagOption([opt, DropdownValueFlag.REMOVE_ON_DESELECT]);
			select(opt);

			// TODO: Add another test for this. Conflation is happening here
			// removeOption(opt);

			await vi.advanceTimersByTimeAsync(100);

			expect(get(options)[0]).toEqual({ ...opt3, removeOnDeselect: false, selected: false });
			expect(get(options)[1]).toEqual({ ...opt, removeOnDeselect: true, selected: true });
			expect(get(options)[2]).toEqual({ ...opt2, removeOnDeselect: false, selected: false });
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
		it('should add multiple options at once', async () => {
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
	});
	describe('single select', () => {
		it('should allow you to select an option', async () => {
			const { addOptions, toggleSelected, selectedOptions } = dropdownOptionStore();
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
		it('should allow you to deselect an option', async () => {
			const { addOptions, toggleSelected, selectedOptions } = dropdownOptionStore();
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
	});
	describe('multi select', () => {
		it('should allow you to select multiple options', async () => {
			const { addOptions, toggleSelected, selectedOptions } = dropdownOptionStore();

			const opt = { value: 1, label: 'test' };
			const opt2 = { value: 2, label: 'test' };
			addOptions(opt, opt2);

			toggleSelected(opt, opt2);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(selectedOptions).map((v) => ({ label: v.label, value: v.value }))).toEqual([
				{ value: opt.value, label: opt.label },
				{ value: opt2.value, label: opt2.label }
			]);
		});
		it('should allow you to deselect options', async () => {
			const { addOptions, toggleSelected, selectedOptions } = dropdownOptionStore();
			const opt = { value: 1, label: 'test' };
			const opt2 = { value: 2, label: 'test' };
			addOptions(opt, opt2);
			toggleSelected(opt, opt2);
			await vi.advanceTimersByTimeAsync(100);
			toggleSelected(opt);
			await vi.advanceTimersByTimeAsync(100);
			expect(get(selectedOptions).map((v) => ({ label: v.label, value: v.value }))).toEqual([
				{ value: opt2.value, label: opt2.label }
			]);
		});
	});
});
