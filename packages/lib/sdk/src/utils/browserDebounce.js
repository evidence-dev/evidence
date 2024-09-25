import { debounce } from 'perfect-debounce';

/** @type {typeof debounce} */
export function browserDebounce(fn, wait, options) {
	return (...args) => Promise.resolve(fn(...args));
	if (typeof window === 'undefined') {
		// debounce()() returns a promise
	} else {
		return debounce(fn, wait, options);
	}
}
