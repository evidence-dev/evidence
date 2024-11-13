// @ts-check

import { getContext, setContext } from 'svelte';
import { derived, get, readable, readonly } from 'svelte/store';
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

export class ThemeStores {
	/** @type {Readable<'light' | 'dark'>} */
	#systemTheme;

	get systemTheme() {
		return this.#systemTheme;
	}

	/** @type {Writable<'light' | 'dark' | 'system'>} */
	#selectedAppearance;

	get selectedAppearance() {
		return readonly(this.#selectedAppearance);
	}

	/** @type {Readable<'light' | 'dark'>} */
	#activeAppearance;

	get activeAppearance() {
		return this.#activeAppearance;
	}

	/** @type {Readable<Theme>} */
	#theme;

	get theme() {
		return this.#theme;
	}

	get themesConfig() {
		return themesConfig;
	}

	constructor() {
		this.#systemTheme = createSystemThemeStore();

		this.#selectedAppearance = localStorageStore(
			'evidence-theme',
			themesConfig.themes.defaultAppearance,
			{
				serialize: (value) => value,
				deserialize: (raw) =>
					['system', 'light', 'dark'].includes(raw)
						? /** @type {'light' | 'dark' | 'system'} */ (raw)
						: themesConfig.themes.defaultAppearance
			}
		);

		this.#activeAppearance = derived(
			[this.#systemTheme, this.#selectedAppearance],
			([$systemTheme, $selectedAppearance]) => {
				return $selectedAppearance === 'system' ? $systemTheme : $selectedAppearance;
			}
		);

		this.#theme = derived(this.#activeAppearance, ($activeAppearance) => themes[$activeAppearance]);

		this.#activeAppearance.subscribe((theme) => {
			if (typeof document !== 'undefined') {
				document.documentElement.setAttribute('data-theme', theme);
			}
		});
	}

	cycleAppearance = () => {
		this.#selectedAppearance.update((current) => {
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

	/**
	 * @param {string} color
	 * @returns {string | undefined}
	 */
	resolveColor = (color) => {
		if (isBuiltinColor(color)) {
			return get(this.#theme).colors[color];
		}
		return color;
	};

	/**
	 * @param {string} color
	 * @returns {string[] | undefined}
	 */
	resolveColorPalette = (color) => {
		if (isBuiltinColorPalette(color)) {
			return get(this.#theme).colorPalettes[color];
		}
		return undefined;
	};

	/**
	 * @param {string} color
	 * @returns {string[] | undefined}
	 */
	resolveColorScale = (color) => {
		if (isBuiltinColorPalette(color)) {
			return get(this.#theme).colorScales[color];
		}
		return undefined;
	};
}

const THEME_STORES_CONTEXT_KEY = Symbol('__EvidenceThemeStores__');

/** @returns {ThemeStores} */
export const getThemeStores = () => {
	let stores = getContext(THEME_STORES_CONTEXT_KEY);
	if (!stores) {
		stores = new ThemeStores();
		setContext(THEME_STORES_CONTEXT_KEY, stores);
	}
	return stores;
};
