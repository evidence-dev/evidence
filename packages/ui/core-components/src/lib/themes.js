// @ts-check

import { getContext, setContext } from 'svelte';
import { derived, readable, readonly } from 'svelte/store';
import { browser } from '$app/environment';
import { localStorageStore } from '@evidence-dev/component-utilities/stores';
/** @template T @typedef {import("svelte/store").Readable<T>} Readable */
/** @template T @typedef {import("svelte/store").Writable<T>} Writable */

/** @returns {Readable<'light' | 'dark'>} */
const createSystemThemeStore = () => {
	const store = readable(/** @type {'light' | 'dark'} */ ('light'), (set) => {
		if (browser && window.matchMedia) {
			/** @param {MediaQueryList | MediaQueryListEvent} e */
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
		}
	});

	return store;
};

/**
 * @typedef ThemeStores
 * @prop {Readable<'light' | 'dark'>} systemTheme
 * @prop {Readable<'system' | 'light' | 'dark'>} selectedTheme
 * @prop {Readable<'light' | 'dark'>} theme
 * @prop {() => void} cycleTheme
 */

/** @returns {ThemeStores} */
const createThemeStores = () => {
	const systemTheme = createSystemThemeStore();

	/** @type {Writable<'system' | 'light' | 'dark'>} */
	const selectedTheme = localStorageStore('evidence-theme', 'system');

	const theme = derived([systemTheme, selectedTheme], ([$systemTheme, $selectedTheme]) => {
		return $selectedTheme === 'system' ? $systemTheme : $selectedTheme;
	});

	const cycleTheme = () => {
		selectedTheme.update((current) => {
			switch (current) {
				case 'system':
					return 'light';
				case 'light':
					return 'dark';
				case 'dark':
				default:
					return 'system';
			}
		});
	};

	theme.subscribe((theme) => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', theme);
		}
	});

	return {
		systemTheme,
		selectedTheme: readonly(selectedTheme),
		theme,
		cycleTheme
	};
};

const THEME_STORES_CONTEXT_KEY = Symbol('__EvidenceThemeStores__');

/** @returns {ThemeStores} */
export const ensureThemeStores = () => {
	let stores = getContext(THEME_STORES_CONTEXT_KEY);
	if (!stores) {
		stores = createThemeStores();
		setContext(THEME_STORES_CONTEXT_KEY, stores);
	}
	return stores;
};

export const themesFeatureEnabled = import.meta.env.VITE_EVIDENCE_THEMES === 'true';
