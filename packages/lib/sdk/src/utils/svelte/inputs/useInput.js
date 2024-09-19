import { debounce } from 'perfect-debounce';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import { getInputContext } from '../inputs.js';
import { storeMixin } from '../../../lib/store-helpers/storeMixin.js';
import { PrimitiveValue } from '../../recursive-proxy/RecursiveProxyPrimitive.js';

export const SqlFlag = Symbol('SqlFlag');

/**
 * @param {string} name
 * @param {import("./types.js").useInputOptions} [options]
 * @param {{value: any, label?: string} & Record<string,any>} [initialState]
 * @returns {import("../types.js").InputManager}
 */
export const useInput = (name, options, initialState) => {
	const inputStore = getInputContext();
	/** @type {import("../../inputs/Input.js").Input & Record<string, any> | null} */
	const input = inputStore.ensureInput(name, { sqlFragmentFactory: options?.sqlFragmentFactory });
	if (!input) {
		// TODO: Better error message
		throw new EvidenceError('Failed to create input');
	}

	if (!input.initialized) {
		input.initialized = true;
		input.setValue(initialState?.value);
		delete initialState?.value;
		Object.assign(input, { ...initialState });
		input.label = initialState?.label ?? input.value;
	}

	inputStore.update(($inputStore) => {
		$inputStore[name] = input;
		return $inputStore;
	});

	/**
	 * @param {any} value
	 * @param {string} [label]
	 * @param {any} [additional]
	 */
	const updateFn = (value, label, additional) => {
		if (value === SqlFlag) {
			value = options?.sqlFragmentFactory(input) ?? value;
		}
		input.setValue(value);
		input.value = value;
		if (label) input.label = label;
		else input.label = value;
		Object.assign(input, additional);
		publish(input[PrimitiveValue]);
	};

	const { subscribe, publish } = storeMixin();
	publish(input[PrimitiveValue]);

	return {
		__input: input,
		/**
		 * @param {any} value
		 */
		update: options?.debouncePeriod ? debounce(updateFn, options.debouncePeriod) : updateFn,
		subscribe,
		// 🚩 This feels a little off.
		SqlFlag: SqlFlag
	};
};
