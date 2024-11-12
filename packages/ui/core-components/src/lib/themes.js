// @ts-check

import { getContext, setContext } from 'svelte';
import { derived, readable, readonly } from 'svelte/store';
import { browser } from '$app/environment';
import { localStorageStore } from '@evidence-dev/component-utilities/stores';
import { isBuiltinColor, isBuiltinColorPalette } from '@evidence-dev/tailwind';
import { themes, themesConfig } from '$evidence/themes';

/** @template T @typedef {import("svelte/store").Readable<T>} Readable */
/** @template T @typedef {import("svelte/store").Writable<T>} Writable */
/** @typedef {import('@evidence-dev/tailwind').Theme} Theme */
/** @typedef {import('@evidence-dev/tailwind').ThemesConfig} ThemesConfig */

/** @returns {Readable<'light' | 'dark'>} */
const createSystemThemeStore = () => {
	const initialValue =
		browser && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';

	/** @type {Readable<'light' | 'dark'>} */
	const store = readable(initialValue, (set) => {
		if (browser && window.matchMedia) {
			/** @param {MediaQueryList | MediaQueryListEvent} e */
			const onPrefersDarkColorSchemeChange = (e) => {
				set(e.matches ? 'dark' : 'light');
			};

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
 * @prop {Readable<'light' | 'dark'>} systemMode
 * @prop {Readable<'system' | 'light' | 'dark'>} selectedMode
 * @prop {Readable<'light' | 'dark'>} activeMode
 * @prop {Readable<Theme>} theme
 * @prop {ThemesConfig} themesConfig
 * @prop {() => void} cycleMode
 */

/** @returns {ThemeStores} */
const createThemeStores = () => {
	const systemMode = createSystemThemeStore();

	/** @type {Writable<'system' | 'light' | 'dark'>} */
	const selectedMode = localStorageStore('evidence-theme', themesConfig.themes.defaultAppearance, {
		serialize: (value) => value,
		deserialize: (raw) =>
			['system', 'light', 'dark'].includes(raw)
				? /** @type {'light' | 'dark' | 'system'} */ (raw)
				: themesConfig.themes.defaultAppearance
	});

	const activeMode = derived([systemMode, selectedMode], ([$systemTheme, $selectedTheme]) => {
		return $selectedTheme === 'system' ? $systemTheme : $selectedTheme;
	});

	const theme = derived(activeMode, ($activeTheme) => themes[$activeTheme]);

	const cycleMode = () => {
		selectedMode.update((current) => {
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

	activeMode.subscribe((theme) => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', theme);
		}
	});

	return {
		systemMode,
		selectedMode: readonly(selectedMode),
		activeMode,
		theme,
		themesConfig,
		cycleMode
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

/**
 * @param {string} color
 * @param {Theme} theme
 * @returns {string | undefined}
 */
export const resolveColor = (color, theme) => {
	if (isBuiltinColor(color)) {
		return theme.colors[color];
	}
	return color;
};

/**
 * @param {string} color
 * @param {Theme} theme
 * @returns {string[] | undefined}
 */
export const resolveColorPalette = (color, theme) => {
	if (isBuiltinColorPalette(color)) {
		return theme.colorPalettes[color];
	}
	return undefined;
};

/**
 * @param {string} color
 * @param {Theme} theme
 * @returns {string[] | undefined}
 */
export const resolveColorScale = (color, theme) => {
	if (isBuiltinColorPalette(color)) {
		return theme.colorScales[color];
	}
	return undefined;
};
