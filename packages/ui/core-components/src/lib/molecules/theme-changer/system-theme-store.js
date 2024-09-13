/** @template T @typedef {import("svelte/store").Readable<T>} Readable */

import { browser } from '$app/environment';
import { readable } from 'svelte/store';

/** @returns {Readable<'light' | 'dark'>} */
export const createSystemThemeStore = () => {
	const store = readable('light', (set) => {
		if (browser && window.matchMedia) {
			/** @param {MediaQueryList} e */
			const onPrefersDarkColorSchemeChange = (e) => {
				set(e.matches ? 'dark' : 'light');
			};

			// Initialize the store with the current value
			onPrefersDarkColorSchemeChange(window.matchMedia('(prefers-color-scheme: dark)'));

			// Listen for changes to the system color scheme and update the store
			window
				.matchMedia('(prefers-color-scheme: dark)')
				.addEventListener('change', onPrefersDarkColorSchemeChange);

			// Cleanup
			return () => {
				window
					.matchMedia('(prefers-color-scheme: dark)')
					.removeEventListener('change', onPrefersDarkColorSchemeChange);
			};
		} else {
			console.log('not browser');
		}
	});

	return store;
};
