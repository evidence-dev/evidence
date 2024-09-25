// import { debounce } from 'perfect-debounce';

/** @type {typeof import("perfect-debounce").debounce}*/
export function browserDebounce(
	fn
	// wait, options
) {
	// 🚩 This will get undone with the DAG PR, for now this is required to prevent rendering jank
	return (...args) => Promise.resolve(fn(...args));
	// if (typeof window === 'undefined') {
	//     // debounce()() returns a promise
	//     return (...args) => Promise.resolve(fn(...args));
	// } else {
	//     return debounce(fn, wait, options);
	// }
}
