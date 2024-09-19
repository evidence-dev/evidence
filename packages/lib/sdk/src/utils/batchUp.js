import { debounce } from 'perfect-debounce';

/**
 * @template Input
 * @param {((inputs: Input[]) => unknown) | ((...i: (Input[] | Input)[]) => unknown)} fn
 * @param {number} [timeout=200]
 * @returns {(i: Input) => unknown}
 */
export const batchUp = (fn, timeout = 200) => {
	/** @type {Input[]} */
	const collected = [];

	const execute = () => {
		fn([...collected]); // clone collected array before resetting it
		collected.length = 0;
	};

	// todo: possibly algorithmic nightmare at high n on server?
	const finalize = typeof window === 'undefined' ? execute : debounce(execute, timeout);

	return (...i) => {
		collected.push(...i);
		return finalize();
	};
};
