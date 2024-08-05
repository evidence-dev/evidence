import { derived, get, readonly, writable } from 'svelte/store';
import { batchUp } from '@evidence-dev/sdk/utils';
// TODO use lodash/merge not lodash.merge
import merge from 'lodash.merge';
/** @template T @typedef {import("svelte/store").R} */

/**
 * @typedef {Object} DropdownValue
 * @property {string | undefined | null} label
 * @property {string | undefined | null} value
 * @property {number} idx
 * @property {boolean} selected
 * @property {boolean} [__auto]
 * @property {boolean} [__removeOnDeselect]
 */

/**
 * @param {DropdownValue} a
 * @returns {string}
 */
const optStr = (a) => String(a.value) + String(a.label);


/**
 * @param {DropdownValue} a
 * @param {DropdownValue} b
 * @returns {boolean}
 */
const optEq = (a, b) => {
	return a.value === b.value && a.label === b.label;
};
/**
 * @typedef {Object} DropdownOptionStoreOpts
 * @property {boolean} [multiselect=false]
 * @property {DropdownValue[]} [initialValues] This should be pulled from $inputs[name].rawValues
 * @property {(string | number)[]} [defaultValues]
 */

/** @type {DropdownOptionStoreOpts} */
const defaultOpts = {
	multiselect: false,
	initialValues: [],
	defaultValues: []
};

const hygiene = ($options) => {
	// Uniqueify
	const knownValues = new Set();
	$options = $options.reduce((a, c) => {
		if (!knownValues.has(optStr(c))) {
			knownValues.add(optStr(c));
			a.push(c);
		}
		return a;
	}, /** @type {DropdownValue[]} */ ([]));

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
			return a.idx - b.idx;
		}

		// Sort by label
		const labelDiff = a.label.localeCompare(b.label);
		if (labelDiff !== 0) return labelDiff;

		// If labels are the same, sort by value
		return a.value.toString().localeCompare(b.value.toString());
	});

	return $options;
};

/**
 * @param {Partial<DropdownStoreOpts>} opts
 * @returns
 */
export const dropdownOptionStore = (inputOptions = {}) => {
	const opts = merge({}, defaultOpts, inputOptions);

	/** @type {import("svelte/store").Writable<DropdownValue[]>} */
	const options = writable([]);
	/** @type {import("svelte/store").Readable<DropdownValue[]>} */
	const outOptions = readonly(options);
	/** @type {import("svelte/store").Readable<DropdownValue[]>} */
	const selectedOptions = derived(options, ($options) =>
		$options.filter((option) => option.selected)
	);

	options.update = (updater) => {
		// Enforce hygiene
		const result = updater(get(options));
		options.set(hygiene(result));
	}

	return {
		/**
		 * @param {...DropdownValue} option
		 */
		addOptions: batchUp(
			/**
			 * @param  {...(DropdownValue[] | DropdownValue)} newOptions
			 */
			(...newOptions) => {
				const opts = newOptions.flat();
				options.update(($options) => {
					opts.forEach((option) => {
						if (!option) return;

						// Apply defaults for option
						if (!('__auto' in option)) option.__auto = false;
						if (!('selected' in option)) option.selected = false;
						if (!('idx' in option)) option.idx = -1; // non-auto options float to the top

						const exists = $options.find((other) => optEq(other, option));
						if (!exists) $options.push(option);
					});
					return $options;
				});
			},
			100
		),
		/**
		 * @param  {...DropdownValue} removeOptions
		 */
		removeOptions: batchUp(
			/** @param {...(DropdownValue[] | DropdownValue)} removeOptions */
			(...removeOptions) => {
				const opts = removeOptions.flat();
				options.update(($options) => {
					return $options.reduce((a, v) => {
						if (!v) return a;
						if (opts.find((x) => optEq(x, v))) {
							if (v.selected) v.__removeOnDeselect = true;
							else return a;
						}
						a.push(v);
						return a;
					}, /** @type {DropdownValue[]} */ ([]));
				});
			},
			100
		),
		/**
		 * @param  {...DropdownValue} toggleOptions
		 * @returns {void}
		 */
		toggleSelected: batchUp(
			/** @param {...(DropdownValue[] | DropdownValue)} removeOptions */
			(...toggleOptions) => {
				const toToggle = toggleOptions.flat();
				options.update(($options) => {
					if (opts.multiselect) {
						// For multi-select, toggle each option
						return $options.reduce((a, v) => {
							if (!v) return a;
							if (toToggle.find((x) => optEq(x, v))) {
								if (v.__removeOnDeselect) {
									if (!v.selected) {
										console.debug(
											'A dropdown option should never have __removeOnDeselect AND not selected at the same time.\nOption will be removed'
										);
									}
									return a;
								}
								v.selected = !v.selected;
							}
							a.push(v);
							return a;
						}, /** @type {DropdownValue[]} */ ([]));
					} else {
						// For single-select, deselect everything and select only the last option
						$options.forEach((o) => (o.selected = false));

						const toSelect = toToggle.at(-1);

						const output = $options.reduce((a, v) => {
							if (optEq(v, toSelect)) {
								v.selected = true;
							}

							if (v.__removeOnDeselect && !v.selected) {
								return a;
							}

							a.push(v);
							return a;
						}, /** @type {DropdownValue[]} */ ([]));

						return output;
					}
				});
			},
			100
		),
		options: outOptions,
		selectedOptions
	};
};
