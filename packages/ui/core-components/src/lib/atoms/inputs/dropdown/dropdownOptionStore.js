import { derived, readonly, writable } from 'svelte/store';
import { batchUp } from '@evidence-dev/sdk/utils';
/** @template T @typedef {import("svelte/store").R} */

/**
 * @typedef {Object} DropdownValue
 * @property {string | undefined | null} label
 * @property {string | undefined | null} value
 * @property {number} idx
 * @property {boolean} selected
 * @property {boolean} [__auto]
 * @property {boolean} [hangover]
 */

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

/**
 * @param {Partial<DropdownStoreOpts>} opts
 * @returns
 */
export const dropdownOptionStore = (opts = {}) => {
	Object.assign(opts, defaultOpts, opts); // Merge in default options

	/** @type {import("svelte/store").Writable<DropdownValue[]>} */
	const options = writable([]);
	/** @type {import("svelte/store").Readable<DropdownValue[]>} */
	const outOptions = readonly(options);
	/** @type {import("svelte/store").Readable<DropdownValue[]>} */
	const selectedOptions = derived(options, ($options) =>
		$options.filter((option) => option.selected)
	);

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
							if (v.selected) v.hangover = true;
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
								if (v.hangover) {
									if (!v.selected) {
										console.warn(
											'A dropdown option should never be hungover AND not selected at the same time.\nOption will be removed'
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
						const updated = $options.map(o => {o.selected = false; return o;})
						const toSelect = toggleOptions.at(-1);
						return updated.map(v => {
							if (optEq(v, toSelect)) v.selected = true;
							return v;
						})
					}
				});
			},
			100
		),
		options: outOptions,
		selectedOptions
	};
};
