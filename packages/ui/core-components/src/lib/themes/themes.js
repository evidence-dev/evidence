// @ts-check

import { getContext, setContext } from 'svelte';
import { derived, get, readable, readonly } from 'svelte/store';
import { browser } from '$app/environment';
import { localStorageStore } from '@evidence-dev/component-utilities/stores';
import { themes, themesConfig } from '$evidence/themes';
import { convertLightToDark } from './convertLightToDark.js';
import chroma from 'chroma-js';

/** @template T @typedef {import("svelte/store").Readable<T>} Readable */
/** @template T @typedef {import("svelte/store").Writable<T>} Writable */
/** @typedef {import('@evidence-dev/tailwind').Theme} Theme */
/** @typedef {import('@evidence-dev/tailwind').ThemesConfig} ThemesConfig */

const { defaultAppearance, appearanceSwitcher } = themesConfig.theme;

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
			themesConfig.theme.defaultAppearance,
			{
				serialize: (value) => value,
				deserialize: (raw) => {
					if (!appearanceSwitcher) return defaultAppearance;
					return ['system', 'light', 'dark'].includes(raw)
						? /** @type {'light' | 'dark' | 'system'} */ (raw)
						: themesConfig.theme.defaultAppearance;
				}
			}
		);

		this.#activeAppearance = derived(
			[this.#systemTheme, this.#selectedAppearance],
			([$systemTheme, $selectedAppearance]) => {
				return $selectedAppearance === 'system' ? $systemTheme : $selectedAppearance;
			}
		);

		this.#theme = derived(this.#activeAppearance, ($activeAppearance) => themes[$activeAppearance]);
	}

	/** @param {HTMLElement} element */
	syncDataThemeAttribute = (element) => {
		// Sync activeAppearance -> html[data-theme]
		const unsubscribe = this.#activeAppearance.subscribe(($activeAppearance) => {
			const current = element.getAttribute('data-theme');
			if (current !== $activeAppearance) {
				element.setAttribute('data-theme', $activeAppearance);
			}
		});

		// Sync html[data-theme] -> activeAppearance
		const observer = new MutationObserver((mutations) => {
			const html = /** @type {HTMLHtmlElement} */ (mutations[0].target);
			const theme = html.getAttribute('data-theme');
			if (!theme || !['light', 'dark'].includes(theme)) return;
			const current = get(this.#activeAppearance);
			if (theme !== current) {
				this.#selectedAppearance.set(/** @type {'light' | 'dark'} */ (theme));
			}
		});
		observer.observe(element, { attributeFilter: ['data-theme'] });

		return () => {
			unsubscribe();
			observer.disconnect();
		};
	};

	/** @param {'light' | 'dark' | 'system'} appearance */
	setAppearance = (appearance) => {
		this.#selectedAppearance.set(appearance);
	};

	cycleAppearance = () => {
		if (!appearanceSwitcher) return;
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
	 * @template T
	 * @param {T} input
	 * @param {'light' | 'dark'} appearance
	 * @returns {string | T | undefined}
	 */
	static #resolveColor = (input, appearance) => {
		if (typeof input === 'string') {
			const lightColor = themes.light.colors[input.trim()];
			const darkColor = themes.dark.colors[input.trim()];

			if (appearance === 'light') {
				return lightColor ?? input;
			}
			if (appearance === 'dark') {
				return darkColor ?? convertLightToDark(lightColor ?? input) ?? input;
			}
		}

		if (isStringTuple(input)) {
			const [light, dark] = input;

			const lightColor = themes.light.colors[light.trim()];
			const darkColor = dark ? (themes.dark.colors[dark?.trim()] ?? dark) : undefined;

			if (appearance === 'light') {
				return lightColor ?? light;
			}
			if (appearance === 'dark') {
				return darkColor ?? convertLightToDark(lightColor ?? light) ?? dark;
			}
		}

		return undefined;
	};

	/**
	 * @template T
	 * @param {T} input
	 * @returns {Readable<string | T | undefined>}
	 */
	resolveColor = (input) =>
		derived(this.#activeAppearance, ($activeAppearance) =>
			ThemeStores.#resolveColor(input, $activeAppearance)
		);

	/**
	 * @template T
	 * @param {Record<string, T> | undefined} input
	 * @returns {Readable<Record<string, (string | T | undefined)> | undefined>}
	 */
	resolveColorsObject = (input) => {
		if (!input) return readable(undefined);

		return derived(this.#activeAppearance, ($activeAppearance) =>
			Object.fromEntries(
				Object.entries(input).map(([key, color]) => [
					key,
					ThemeStores.#resolveColor(color, $activeAppearance)
				])
			)
		);
	};

	/**
	 * @template T
	 * @param {T} input
	 * @returns {Readable<string[] | (T[number])[] | undefined>}
	 */
	resolveColorPalette = (input) => {
		if (typeof input === 'string') {
			return derived(this.#theme, ($theme) => $theme.colorPalettes[input.trim()]);
		}

		if (Array.isArray(input)) {
			return derived(this.#activeAppearance, ($activeAppearance) =>
				input.map((color) => ThemeStores.#resolveColor(color, $activeAppearance))
			);
		}

		return readable(undefined);
	};

	/**
	 * @template T
	 * @param {T} input
	 * @returns {Readable<string[] | (T[number])[] | undefined>}
	 */
	resolveColorScale = (input) => {
		if (typeof input === 'string') {
			return derived(this.#theme, ($theme) => {
				const colorScale = $theme.colorScales[input.trim()];
				if (colorScale) return colorScale;

				const color = $theme.colors[input.trim()];
				if (color) return [$theme.colors['base-100'], color];

				if (chroma.valid(input)) {
					return [$theme.colors['base-100'], input];
				}

				return undefined;
			});
		}

		if (Array.isArray(input)) {
			return derived(this.#activeAppearance, ($activeAppearance) =>
				input.map((color) => ThemeStores.#resolveColor(color, $activeAppearance))
			);
		}

		return readable(undefined);
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

/** @typedef {[string] | [string, string]} StringTuple */

/**
 * @param {unknown} input
 * @returns {input is StringTuple}
 */
const isStringTuple = (input) =>
	Array.isArray(input) &&
	(input.length === 1 || input.length === 2) &&
	input.every((item) => typeof item === 'string');
