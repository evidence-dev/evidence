import { debounce } from 'perfect-debounce';

/** @type {typeof debounce} */
export function browserDebounce(fn, wait, options) {
	if (typeof window === 'undefined') {
		// debounce()() returns a promise
		return (...args) => Promise.resolve(fn(...args));
	} else {
		return debounce(fn, wait, options);
	}
}
