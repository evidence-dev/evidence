import { writable, derived, get, readonly } from 'svelte/store';
import { batchUp, sharedPromise } from '@evidence-dev/sdk/utils';

/**
 * @typedef {Object} DropdownValue
 * @property {string} label
 * @property {string} value
 * @property {number} idx
 * @property {boolean} [removeOnDeselect]
 * @property {boolean} [ignoreSelected]
 * @property {boolean} selected
 * @property {boolean} [__auto]
 */

// Enum
/** @enum {Symbol} */
export const DropdownValueFlag = Object.freeze({
	REMOVE_ON_DESELECT: Symbol('removeOnDeselect'),
	IGNORE_SELECTED: Symbol('ignoreSelected'),
	FORCE_SELECT: Symbol('forceSelect'),
	FORCE_DESELECT: Symbol('forceDeselect')
});

/** @type {typeof batchUp<DropdownValue>} */
const typedBatchup = batchUp;
/** @type {typeof batchUp<[DropdownValue, DropdownValueFlag]>} */
const flagBatchup = batchUp;

/**
 * @param {DropdownValue} a
 * @param {DropdownValue} b
 * @returns {boolean}
 */
const optEq = (a, b) => {
	return a.value === b.value && a.label === b.label;
};
/**
 * @param {DropdownValue} a
 * @returns {string}
 */
const optStr = (a) => a.value + a.label;

/**
 * @param {boolean} [multi=false]
 * @param {number} [delay=100]
 */
export const dropdownOptionStore = (multi = false, delay = 100) => {
	/** @type {import("svelte/store").Writable<DropdownValue[]>} */
	const options = writable([]);

	/**
	 * @param {DropdownValue[]} $options
	 */
	const hygiene = ($options) => {
		const knownValues = new Set();
		// uniqueify
		$options = $options.reduce((a, c) => {
			if (!knownValues.has(optStr(c))) {
				knownValues.add(optStr(c));
				a.push(c);
			}
			return a;
		}, []);

		// sort
		$options = $options.sort((a, b) => {
			// automatic values should fall below all query options
			if (a.__auto && !b.__auto) return 1;
			if (b.__auto && !a.__auto) return -1;

			if (a.removeOnDeselect && a.selected) {
				return -1;
			}
			if (b.removeOnDeselect && b.selected) {
				return 1;
			}

			if (a.idx !== b.idx) {
				return a.idx - b.idx;
			}

			if (a.label !== b.label) return a.label.toString().localeCompare(b.label.toString());

			if (typeof a.value === 'number' && typeof b.value === 'number') {
				return a.value - b.value;
			}

			return a.value.toString().localeCompare(b.value.toString());
		});

		return $options;
	};

	/** @type {import("svelte/store").Writable<DropdownValue[]>} */
	const selectedOptions = derived(options, (x) => x.filter((y) => y.selected));

	/** @type {import("svelte/store").Unsubscriber[]} */
	const cleanup = [];

	/*
		We use these 2 shared promises to avoid concurrency issues
		If we have any pending option changes, all select operations
		will wait for them to finish out before operating.
		This helps prevent issues when trying to select defaults that
		don't yet exist because addOption hasn't processed them into
		the store yet.
	*/
	let addOptionSharedPromise = sharedPromise();
	addOptionSharedPromise.resolve(); // initially these are resolved

	let removeOptionSharedPromise = sharedPromise();
	removeOptionSharedPromise.resolve(); // initially these are resolved

	let flagOptionSharedPromise = sharedPromise();
	flagOptionSharedPromise.resolve(); // initially these are resolved

	const addOption = typedBatchup(async (addedOptions) => {
		await flagOptionSharedPromise.promise;
		try {
			// Apply defaults
			addedOptions = addedOptions.map((opt) => ({
				...opt,
				idx: opt.idx ?? -1,
				removeOnDeselect: opt.removeOnDeselect ?? false
			}));
			if (!addedOptions.length) return;
			options.update(($options) => {
				$options.push(...addedOptions);
				return hygiene($options);
			});
		} finally {
			addOptionSharedPromise.resolve();
		}
	}, delay);

	const removeOption = typedBatchup(async (removedOptions) => {
		await flagOptionSharedPromise.promise;
		try {
			if (!removedOptions.length) return;
			options.update(($options) => {
				$options = $options.filter((option) => {
					const optionIsTargetted = removedOptions.some((removedOption) =>
						optEq(option, removedOption)
					);
					if (!optionIsTargetted) return true;
					if (option.selected && !option.ignoreSelected) return true;
					return false;
				});
				return hygiene($options);
			});
		} finally {
			removeOptionSharedPromise.resolve();
		}
	}, delay);

	/**
	 * @param {[DropdownValue, DropdownValueFlag][]} opts
	 */
	const flagOption = flagBatchup((flaggedOptions) => {
		try {
			if (!flaggedOptions.length) return;
			options.update(($options) => {
				$options = $options.map(($option) => {
					const flagApplications = flaggedOptions.filter(([flagOption]) =>
						optEq($option, flagOption)
					);
					// More than one flag application may appear in a single update
					// We need to ensure that the full operation list is applied
					for (const application of flagApplications) {
						switch (application[1]) {
							case DropdownValueFlag.REMOVE_ON_DESELECT:
								$option.removeOnDeselect = !$option.removeOnDeselect;
								break;
							case DropdownValueFlag.IGNORE_SELECTED:
								$option.ignoreSelected = !$option.ignoreSelected;
								break;
							case DropdownValueFlag.FORCE_SELECT:
								$option.selected = true;
								break;
							case DropdownValueFlag.FORCE_DESELECT:
								$option.selected = true;
								break;
						}
					}
					return $option;
				});
				return hygiene($options);
			});
		} finally {
			flagOptionSharedPromise.resolve();
		}
	}, delay);

	/**
	 * @param {DropdownValue} opt
	 */
	const select = (opt) => {
		if (!opt) return;
		options.update(($options) => {
			const target = $options.find((x) => x.value === opt.value && x.label === opt.label);
			if (multi) {
				if (target) target.selected = !target.selected;
			} else {
				$options = $options.map(($opt) => {
					if (optEq($opt, opt)) $opt.selected = true;
					else $opt.selected = false;
					return $opt;
				});
			}
			return hygiene($options);
		});
	};

	/**
	 * @param {DropdownValue[]} selectionToggles
	 * @param {DropdownValue[]} allOptions
	 */
	const cleanRemoveOnSelects = (selectionToggles, allOptions) => {
		for (const option of allOptions) {
			if (option.selected && option.removeOnDeselect) {
				const matchingToggles = selectionToggles.filter((x) => optEq(x, option));
				if (matchingToggles.length % 2 === 1) {
					// odd number means the state will be opposite
					removeOption(option);
				}
			}
		}
	};

	return {
		options: readonly(options),
		destroy() {
			cleanup.forEach((c) => c());
		},
		selectedOptions,
		addOption: (...args) => {
			if (addOptionSharedPromise.state !== 'loading') {
				addOptionSharedPromise = sharedPromise();
				addOptionSharedPromise.start();
			}
			addOption(...args);
		},
		removeOption: (...args) => {
			if (removeOptionSharedPromise.state !== 'loading') {
				removeOptionSharedPromise = sharedPromise();
				removeOptionSharedPromise.start();
			}
			removeOption(...args);
		},
		flagOption: (...args) => {
			if (flagOptionSharedPromise.state !== 'loading') {
				flagOptionSharedPromise.start();
			}
			flagOption(...args);
		},
		select: typedBatchup(async (selectOptions) => {
			await Promise.all([
				addOptionSharedPromise.promise,
				removeOptionSharedPromise.promise,
				flagOptionSharedPromise.promise
			]);
			cleanRemoveOnSelects(selectOptions, get(options));
			for (const option of selectOptions) {
				select(option);
			}
		}, delay),
		deselectAll: (autoOnly = false) => {
			cleanRemoveOnSelects(get(selectedOptions), get(options));
			for (const opt of get(selectedOptions)) {
				if (autoOnly && !opt.__auto) continue;
				select(opt);
			}
		}
	};
};
