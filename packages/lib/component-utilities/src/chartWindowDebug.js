import { browser } from '$app/environment';

const s = Symbol.for('__evidence-chart-window-debug__');

/**
 * @param {string} key
 * @param {unknown} value
 */
export const set = (key, value) => {
	if (!browser) return;
	if (!window[s]) window[s] = {};
	window[s][key] = value;
};

/**
 * @param {string} key
 */
export const unset = (key) => {
	if (!browser) return;
	if (!window[s]) window[s] = {};
	delete window[s][key];
};
