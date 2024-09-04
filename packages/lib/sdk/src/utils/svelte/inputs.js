import { getAllContexts, getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

export const InputStoreKey = Symbol('InputStore');

/**
 * @typedef {Object} InputValue
 * @property {any} value
 * @property {string} label
 */

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
 * Returns a factory function used to interact with the input store at the specified path.
 * @param {string | string[]} inputKey
 * @param {boolean} [toggle]
 * @param {string} [defaultSqlFragment]
 */
export const getInputSetter = (inputKey, toggle, defaultSqlFragment) => {
	const inputs = getInputContext();
	let inputPath = Array.isArray(inputKey) ? inputKey : [inputKey];
	if (!inputPath.length) {
		return () => {
			console.warn(`Failed to update input: ${inputPath} is not a valid input path`);
		};
	}
	/**
	 * @param {any} value
	 * @param {string} [label]
	 * @param {string} [sqlFragment]
	 * @param {any} [additional]
	 */
	return (value, label, sqlFragment, additional) => {
		inputs.update(($inputs) => {
			
			let target = $inputs;
			let finalKey = inputPath.at(-1);
			for (const p of inputPath.slice(0, -1)) {
				target = target[p];
			}
			if (!value && !label) {
				console.log("Unset")
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
