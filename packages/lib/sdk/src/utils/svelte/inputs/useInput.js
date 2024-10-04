import { debounce } from 'perfect-debounce';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import { getInputContext } from '../inputs.js';
import { storeMixin } from '../../../lib/store-helpers/storeMixin.js';
import { PrimitiveValue } from '../../recursive-proxy/RecursiveProxyPrimitive.js';
import { DagNode } from '../../dag/DagNode.js';

export const UseSqlFactory = Symbol('UseSqlFactory');

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
	input.ignoreKey('initialized');

	if (!input.initialized) {
		input.initialized = true;

		if (typeof initialState?.value !== 'undefined') {
			input.setValue(initialState?.value);
		}
		delete initialState?.value;
		Object.assign(input, { ...initialState });

		if (typeof initialState?.label !== 'undefined' || typeof initialState?.value !== 'undefined') {
			input.label = initialState?.label ?? input.value;
		}
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
		Object.assign(input, additional);
		if (typeof label !== 'undefined') input.label = label;
		if (value === UseSqlFactory) {
			value = options?.sqlFragmentFactory(input) ?? value;
		}
		input.setValue(value);
		input.value = value;

		if (typeof label === 'undefined') input.label = value;

		publish(input[PrimitiveValue]);
	};

	let source = options?.dataSource;
	if (source && DagNode.isDagNode(source?.__dag)) {
		input.__dag.registerDependency(source.__dag);
	}

	const { subscribe, publish } = storeMixin();
	publish(input[PrimitiveValue]);

	return {
		__input: input,
		/**
		 * @param {any} values
		 */
		update: options?.debouncePeriod ? debounce(updateFn, options.debouncePeriod) : updateFn,
		subscribe,
		UseSqlFactory: UseSqlFactory,
		/** @param {import("../../dag/types.js").WithDag} [data] */
		updateDatasource: (data) => {
			if (source) input.__dag.deregisterDependency(source.__dag);
			source = data;
			if (source) input.__dag.registerDependency(source.__dag);
		}
	};
};
