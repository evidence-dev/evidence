// @ts-check

import { writable, derived, get, readonly } from 'svelte/store';
import { batchUp, sharedPromise } from '@evidence-dev/sdk/utils';

/**
 * @typedef {Object} DropdownValue
 * @property {string | undefined | null} label
 * @property {string | undefined | null} value
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
const optStr = (a) => String(a.value) + String(a.label);

/**
 * @param {boolean} [multi=false]
 * @param {number} [delay=100]
 * @param {DropdownValue[]} initialState
 */
export const dropdownOptionStore = (multi = false, delay = 100, initialState = []) => {
	if (Array.isArray(initialState)) {
		console.log({
			initialState: JSON.parse(JSON.stringify([...initialState]))
		})
	}
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
		}, /** @type {DropdownValue[]} */ ([]));

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

			if (
				typeof a.label !== 'undefined' &&
				a.label !== null &&
				typeof b.label !== 'undefined' &&
				b.label !== null &&
				a.label !== b.label
			)
				return a.label.toString().localeCompare(b.label.toString());

			if (typeof a.value === 'number' && typeof b.value === 'number') {
				return a.value - b.value;
			}

			if (
				a.value !== null &&
				typeof a.value !== 'undefined' &&
				b.value !== null &&
				typeof b.value !== 'undefined'
			) {
				return a.value.toString().localeCompare(b.value.toString());
			}

			return 0;
		});

		return $options;
	};

	/** @type {import("svelte/store").Readable<DropdownValue[]>} */
	console.log('creating selectedOptions', {
		options: JSON.parse(JSON.stringify(get(options))),
		selected: JSON.parse(JSON.stringify(get(options).filter(o => o.selected)))
	})
	const selectedOptions = derived(options, ($options) => {
		const selected = $options.filter(option => option.selected)
		console.log('deriving selectedOptions', JSON.parse(JSON.stringify({ $options, selected })))
		return selected
	});

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
	 * @param {[DropdownValue, DropdownValueFlag][]} flaggedOptions
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
	 * @param {DropdownValue[]} opts
	 */
	const select = (opts) => {
		options.update(($options) => {
			console.log({$options})
			for (const opt of opts) {
				if (!opt) continue;
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
		/** @param {DropdownValue} option */
		addOption: (option) => {
			if (addOptionSharedPromise.state !== 'loading') {
				addOptionSharedPromise = sharedPromise();
				addOptionSharedPromise.start();
			}
			addOption(option);
		},
		/** @param {DropdownValue} option */
		removeOption: (option) => {
			if (removeOptionSharedPromise.state !== 'loading') {
				removeOptionSharedPromise = sharedPromise();
				removeOptionSharedPromise.start();
			}
			removeOption(option);
		},
		/**
		 * @param {[DropdownValue, DropdownValueFlag]} args
		 */
		flagOption: (args) => {
			if (flagOptionSharedPromise.state !== 'loading') {
				flagOptionSharedPromise.start();
			}
			flagOption(args);
		},
		select: typedBatchup(async (selectOptions) => {
			await Promise.all([
				addOptionSharedPromise.promise,
				removeOptionSharedPromise.promise,
				flagOptionSharedPromise.promise
			]);
			cleanRemoveOnSelects(selectOptions, get(options));
			select(selectOptions);
		}, delay),
		deselectAll: (autoOnly = false) => {
			cleanRemoveOnSelects(get(selectedOptions), get(options));
			const toDeselect = get(selectedOptions).filter((opt) => {
				// If autoOnly is true, only deselect options that are auto
				if (autoOnly && !opt.__auto) return false;
				return true;
			})
			select(toDeselect);
		},
		get flushed() {
			return Promise.all([
				addOptionSharedPromise.promise,
				removeOptionSharedPromise.promise,
				flagOptionSharedPromise.promise
			]);
		}
	};
};
