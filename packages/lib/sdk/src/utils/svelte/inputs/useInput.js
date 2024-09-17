import { debounce } from 'perfect-debounce';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import { getInputContext } from '../inputs.js';

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
	input.setValue(initialState?.value);
	delete initialState?.value;
	Object.assign(input, { ...initialState });
	input.label = initialState?.label ?? input.value;

	// const input = new Input(name, { blocking: false, root: inputStore });
	inputStore.update(($inputStore) => {
		$inputStore[name] = input;
		return $inputStore;
	});

	// TODO: Interact with the input store
	/**
	 * @param {any} value
	 * @param {string} [label]
	 * @param {any} [additional]
	 */
	const updateFn = (value, label, additional) => {
		input.setValue(value);
		input.value = value;
		if (label) input.label = label;
		else input.label = value;
		Object.assign(input, additional);
		// input.update();
	};

	return {
		__input: input,
		/**
		 * @param {any} value
		 *
		 */
		update: options?.debouncePeriod ? debounce(updateFn, options.debouncePeriod) : updateFn
	};
};
