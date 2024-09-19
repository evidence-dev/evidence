import { browserDebounce } from './browserDebounce.js';

/**
 * @template Input
 * @param {((inputs: Input[]) => unknown) | ((...i: (Input[] | Input)[]) => unknown)} fn
 * @param {number} [timeout=200]
 * @returns {(i: Input) => unknown}
 */
export const batchUp = (fn, timeout = 200) => {
	/** @type {Input[]} */
	const collected = [];

	// todo: possibly algorithmic nightmare at high n on server?
	const finalize = browserDebounce(() => {
		fn([...collected]); // clone collected array before resetting it
		collected.length = 0;
	}, timeout);

	return (...i) => {
		collected.push(...i);
		return finalize();
	};
};
