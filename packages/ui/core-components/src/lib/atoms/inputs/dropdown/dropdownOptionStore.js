// @ts-check
import { derived, get, readonly, writable } from 'svelte/store';
import { batchUp } from '@evidence-dev/sdk/utils';
import merge from 'lodash/merge';
import { z } from 'zod';

/** @template T @typedef {import("svelte/store").Readable<T>} Readable<T> */
/** @template T @typedef {import("svelte/store").Writable<T>} Writable<T> */
/** @typedef {ReturnType<typeof batchUp<DropdownOption[] | DropdownOption>>} DropdownOptionBatchUp */

const DropdownOptionSchema = z.object({
	label: z.union([z.string(), z.number()]).optional().nullable(),
	value: z.union([z.string(), z.number(), z.null()]),
	idx: z.number().optional(),
	selected: z.boolean().optional(),
	__auto: z.boolean().optional(),
	__removeOnDeselect: z.boolean().optional()
});

/**
 * @typedef {z.infer<typeof DropdownOptionSchema>} DropdownOption
 */

/**
 * @param {unknown} v
 * @returns {v is DropdownOption}
 */
const isDropdownOption = (v) => DropdownOptionSchema.safeParse(v).success;

/*
	When do defaults get applied?
	  - When we have created the store
	  - After the waitFor conditions
*/

/**
 * @typedef {Object} DropdownOptionStoreOpts
 * @property {boolean} [multiselect=false]
 * @property {DropdownOption[]} [initialOptions] This should be pulled from $inputs[name].rawValues
 * @property {((string | number)[])} [defaultValues]
 * @property {boolean} [noDefault=false] Does not select the first value by default
 * @property {boolean} [selectAllByDefault=false]
 */

/** @type {DropdownOptionStoreOpts} */
const defaultOpts = {
	multiselect: false,
	initialOptions: [],
	defaultValues: [],
	noDefault: false
};

/**
 * @param {DropdownOptionStoreOpts} opts
 */
export const dropdownOptionStore = (opts = {}) => {
	const config = merge({}, defaultOpts, opts);

	/** @type {Writable<DropdownOption[]>} */
	const options = writable(hygiene(config.initialOptions ?? []));

	/**
	 * @param {DropdownOption[]} $options
	 * @returns {DropdownOption[]}
	 */
	const getSelected = ($options) => $options.filter((option) => option.selected);
	/** @type {Readable<DropdownOption[]>} */
	const selectedOptions = derived(
		options,
		($value) => getSelected($value),
		getSelected(config.initialOptions ?? [])
	);

	let sortingPaused = false;
	options.update = (updater) => {
		// Enforce hygiene
		const result = updater(get(options));
		options.set(hygiene(result, sortingPaused));
	};

	const defaultValues = Array.isArray(config.defaultValues)
		? config.defaultValues
		: [config.defaultValues];

	const defaults = new Set(defaultValues);
	if (!config.multiselect && defaults.size > 1) {
		defaults.clear();
		if (defaultValues?.length) defaults.add(defaultValues[0]);
		console.debug('Single-select dropdowns only accept one default value.');
	}
	if ((config.initialOptions?.length ?? 0) > 0) {
		// We don't apply anything with defaults
		defaults.clear();
	}

	let selectFirst =
		!config.multiselect &&
		!config.noDefault &&
		defaultValues?.length === 0 &&
		!config.initialOptions?.some((opt) => opt.selected);
	let selectAll = config.multiselect && config.selectAllByDefault && !config.initialOptions?.length;

	let destroyed = false;
	return {
		addOptions: /** @type {DropdownOptionBatchUp} */ (
			batchUp(
				/**
				 * @param  {...(DropdownOption[] | DropdownOption)} newOptions
				 */
				(...newOptions) => {
					if (destroyed) return;
					const opts = hygiene(
						newOptions.flat().filter((o) => typeof o === 'object' && o !== null),
						sortingPaused
					);
					options.update(($options) => {
						opts.forEach((option) => {
							if (!isDropdownOption(option)) {
								return;
							}

							if (selectFirst) {
								option.selected = true;
								selectFirst = false;
							}

							// Apply defaults
							if (
								option.value !== null &&
								// ensures urlParams in string format pass condition when values are type numbers
								(defaults.has(String(option.value)) || defaults.has(option.value))
							) {
								option.selected = true;
								defaults.delete(option.value);
							}

							// Apply defaults for option
							if (!('__auto' in option)) option.__auto = false;
							if (!('selected' in option)) option.selected = false;
							if (!('idx' in option)) option.idx = -1; // non-auto options float to the top
							const exists = $options.find((other) => optEq(other, option));
							if (selectAll) option.selected = true;
							if (exists && exists.__removeOnDeselect) exists.__removeOnDeselect = false;

							if (!exists) $options.push(option);
						});
						return $options;
					});
					setTimeout(() => {
						// defer to end of event loop
						selectAll = false;
					}, 0);
				},
				100
			)
		),
		/**
		 * @param  {...DropdownOption} removeOptions
		 */
		removeOptions: /** @type {DropdownOptionBatchUp} */ (
			batchUp(
				/** @param {...(DropdownOption[] | DropdownOption)} removeOptions */
				(...removeOptions) => {
					if (destroyed) return;
					const opts = removeOptions.flat();
					options.update(($options) => {
						return $options.reduce((a, v) => {
							if (opts.find((x) => optEq(x, v))) {
								if (v.selected) v.__removeOnDeselect = true;
								else return a;
							}
							a.push(v);
							return a;
						}, /** @type {DropdownOption[]} */ ([]));
					});
				},
				100
			)
		),
		/**
		 * @param  {...DropdownOption} toggleOptions
		 * @returns {void}
		 */
		toggleSelected: /** @type {DropdownOptionBatchUp} */ (
			batchUp(
				/** @param {...(DropdownOption[] | DropdownOption)} toggleOptions */
				(...toggleOptions) => {
					if (destroyed) return;
					const toToggle = toggleOptions.flat();
					options.update(($options) => {
						if (config.multiselect) {
							// For multi-select, toggle each option
							return $options.reduce((a, v) => {
								if (toToggle.find((x) => optEq(x, v))) {
									v.selected = !v.selected;
								}

								a.push(v);
								return a;
							}, /** @type {DropdownOption[]} */ ([]));
						} else {
							// For single-select, deselect everything and select only the last option
							$options.forEach((o) => (o.selected = false));

							const toSelect = toToggle.at(-1);

							const output = $options.reduce((a, v) => {
								if (toSelect && optEq(v, toSelect)) {
									v.selected = true;
								}

								a.push(v);
								return a;
							}, /** @type {DropdownOption[]} */ ([]));
							return output;
						}
					});
				},
				100
			)
		),
		selectAll: () => {
			if (destroyed) return;
			options.update((o) => o.map((o) => ({ ...o, selected: true })));
		},
		deselectAll: () => {
			if (destroyed) return;
			options.update((o) => o.map((o) => ({ ...o, selected: false })));
		},
		options: readonly(options),
		selectedOptions,
		pauseSorting: () => {
			if (destroyed) return;
			sortingPaused = true;
		},
		resumeSorting: () => {
			if (destroyed) return;
			sortingPaused = false;
			options.set(hygiene(get(options)));
		},
		forceSort: () => {
			if (destroyed) return;
			options.set(hygiene(get(options)));
		},
		destroy: () => (destroyed = true)
	};
};

/**
 *
 * @param {DropdownOption[]} $options
 * @param {boolean} [skipSort=false]
 * @returns
 */
const hygiene = ($options, skipSort = false) => {
	// Process __removeOnDeselect
	$options = $options.filter((o) => !(o.__removeOnDeselect && !o.selected));

	// Uniqueify
	const knownValues = new Set();
	$options = $options.reduce((a, c) => {
		if (!knownValues.has(optStr(c))) {
			knownValues.add(optStr(c));
			a.push(c);
		}
		return a;
	}, /** @type {DropdownOption[]} */ ([]));
	if (skipSort) {
		return $options;
	}

	// Sort
	$options = $options.sort((a, b) => {
		// Selected options go to the top
		if (a.selected && !b.selected) return -1;
		if (b.selected && !a.selected) return 1;

		// Auto options go to the bottom
		if (a.__auto && !b.__auto) return 1;
		if (b.__auto && !a.__auto) return -1;

		// Sort by index
		if (a.idx !== b.idx) {
			return (a.idx ?? 0) - (b.idx ?? 0);
		}

		// Sort by label
		// Nulls go to the bottom
		if (a.label === null && b.label !== null) return 1;
		if (b.label === null && a.label !== null) return -1;
		if (a.label === null && b.label === null) return 0;
		// Compare numbers
		if (typeof a.label === 'number' && typeof b.label === 'number' && a.label !== b.label) {
			return a.label - b.label;
		}
		// Compare strings
		if (
			typeof a.label !== 'undefined' &&
			a.label !== null &&
			typeof b.label !== 'undefined' &&
			b.label !== null
		) {
			const labelDiff = a.label.toString().localeCompare(b.label.toString());
			if (labelDiff !== 0) return labelDiff;
		}

		// If labels are the same, sort by value
		if (
			typeof a.value !== 'undefined' &&
			a.value !== null &&
			typeof b.value !== 'undefined' &&
			b.value !== null
		) {
			const valueDiff = a.value.toString().localeCompare(b.value.toString());
			if (valueDiff !== 0) return valueDiff;
		}

		return 0;
	});

	return $options;
};

/**
 * @param {DropdownOption} a
 * @returns {string}
 */
const optStr = (a) => String(a.value) + String(a.label);

/**
 * @param {DropdownOption} a
 * @param {DropdownOption} b
 * @returns {boolean}
 */
const optEq = (a, b) => {
	return a.value === b.value && a.label === b.label;
};
