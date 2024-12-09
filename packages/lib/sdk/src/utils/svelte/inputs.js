import { getAllContexts, getContext, setContext } from 'svelte';
import { get, readable, readonly, writable } from 'svelte/store';

export const InputStoreKey = Symbol('InputStore');

/** @template T; @typedef {import("svelte/store").Readable<T>} Readable */
/** @template T; @typedef {import("svelte/store").Writable<T>} Writable */

/**
 * @typedef {Object} InputValue
 * @property {any} value
 * @property {string} label
 */

/**
 * @param {unknown} v
 * @returns {v is Readable<any>}
 */
export const isReadable = (v) => {
	if (typeof v !== 'object') return false;
	if (v === null) return false;
	return 'subscribe' in v;
};
/**
 * @param {unknown} v
 * @returns {v is Writable<any>}
 */
const isWritable = (v) => {
	if (!isReadable(v)) return false;
	return 'set' in v && 'update' in v;
};

/**
 * @param {Writable<any>} c
 * @returns {Writable<any>}
 */
export const ensureInputContext = (c) => {
	if (!isWritable(c)) {
		console.error({ InputStoreValue: c });
		throw new Error('InputStore must be a writable store');
	}
	if (!getAllContexts().has(InputStoreKey)) {
		setContext(InputStoreKey, c);
		return c;
	} else {
		const existingValue = getContext(InputStoreKey);
		existingValue.set(get(c));
		return existingValue;
	}
};

/**
 * @returns {Writable<any>}
 * @deprecated use 'getInputSetter' whenever possible
 */
export const getInputContext = () => {
	if (!getAllContexts().has(InputStoreKey)) {
		console.warn('InputStoreKey not found in context. Did you forget to call ensureInputContext?');
		return writable({});
	}
	return getContext(InputStoreKey);
};

/**
 *
 * @returns {import("svelte/store").Readable<any>}
 */
export const getReadonlyInputContext = () => {
	if (!getAllContexts().has(InputStoreKey)) {
		console.warn('InputStoreKey not found in context. Did you forget to call ensureInputContext?');
		return readable({});
	}

	const value = getContext(InputStoreKey);
	if (isReadable(value)) {
		return readonly(value);
	} else {
		throw new Error(`InputStoreKey is not a readable store: ${value}`);
	}
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
			let finalKey = inputPath.at(-1) ?? '';
			for (const p of inputPath.slice(0, -1)) {
				target = target[p];
			}
			if (!value && !label) {
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
