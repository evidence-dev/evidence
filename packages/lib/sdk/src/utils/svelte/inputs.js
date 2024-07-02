import { getAllContexts, getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

export const InputStoreKey = Symbol('InputStore');

/**
 * @param {import("svelte/store").Writable<any>} c
 * @returns
 */
export const setInputContext = (c) => {
	setContext(InputStoreKey, c);
};

/**
 * @returns {import("svelte/store").Writable<any>}
 * @deprecated use 'getInputSetter' whenever possible
 */
export const getInputContext = () => {
	if (!getAllContexts().has(InputStoreKey)) {
		console.warn('InputStoreKey not found in context. Did you forget to call setInputContext?');
		return writable({});
	}
	return getContext(InputStoreKey);
};

/**
 * @typedef {Object} GetInputSetterOpts
 * @property {boolean} [toggle] When true, setting the same value to an input twice will unselect that value
 * @property {string} [defaultSqlFragment] Used when the input doesn't have a value, or a SQL fragment was not specified
 */
/**
 * @typedef {Object} InputSetterOpts
 * @property {string} [label] Used in the UI
 * @property {string} [sqlFragment] Default stringifcation when referencing the input directly
 * @property {any} [additional] Additional properties to attach to the input store
 */

/**
 * Returns a factory function used to interact with the input store at the specified path.
 * @param {string | string[]} inputKey
 * @param {GetInputSetterOpts} [opts]
 */
export const getInputSetter = (inputKey, opts = {}) => {
	const { toggle, defaultSqlFragment } = opts;
	const inputs = getInputContext();

	let inputPath = Array.isArray(inputKey) ? inputKey : [inputKey];
	if (!inputPath.length) {
		return () => {
			console.warn(`Failed to update input: ${inputPath} is not a valid input path`);
		};
	}
	/**
	 * either take just an argument, or have value + an options object
	 * @param {any} value
	 * @param {InputSetterOpts} [opts]
	 */
	return (value, opts = {}) => {
		const { label, sqlFragment, additional } = opts;
		inputs.update(($inputs) => {
			let target = $inputs;
			let finalKey = inputPath.at(-1);
			// TODO: When would this happen?
			if (!finalKey) throw new Error();

			for (const p of inputPath.slice(0, -1)) {
				target = target[p];
			}

			if (!value && !label) {
				console.log('Unset');
				target[finalKey] = {
					toString() {
						return defaultSqlFragment;
					}
				};
				return $inputs;
			}
			const result = {
				...additional,
				value,
				label,
				toString() {
					return sqlFragment;
				}
			};
			if (toggle && JSON.stringify(target[finalKey]) === JSON.stringify(result)) {
				target[finalKey] = {
					toString() {
						return defaultSqlFragment;
					}
				};
			} else {
				target[finalKey] = result;
			}

			return $inputs;
		});
	};
};
