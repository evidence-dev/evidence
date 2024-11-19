// @ts-check

import { getContext, setContext } from 'svelte';
import { derived, get, readable, readonly } from 'svelte/store';
import { browser } from '$app/environment';
import { localStorageStore } from '@evidence-dev/component-utilities/stores';
import { isBuiltinColorPalette } from '@evidence-dev/tailwind';
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
	 * @type {{
	 * 		<T>(input: T[]): Readable<(string | T)[]>;
	 * 		<T>(input: Record<string, T>): Readable<Record<string, string | T>>;
	 * 		<T>(input: T): Readable<string | T>;
	 * }}
	 */
	resolveColor = (input) => {
		if (typeof input === 'string') {
			const trimmed = input.trim();
			const r = derived(this.#theme, ($theme) => $theme.colors[trimmed] ?? trimmed);
			return /** @type {any} */ (r);
		}

		if (Array.isArray(input)) {
			const r = derived(this.#theme, ($theme) =>
				input.map((color) => {
					if (typeof color !== 'string') return color;
					return $theme.colors[color] ?? color;
				})
			);
			return /** @type {any} */ (r);
		}

		if (input) {
			return derived(this.#theme, ($theme) =>
				Object.fromEntries(
					Object.entries(input).map(([key, color]) => {
						if (typeof color !== 'string') return [key, color];
						return [key, $theme.colors[color] ?? color];
					})
				)
			);
		}

		const r = readable(input);
		return /** @type {any} */ (r);
	};

	/**
	 * @param {unknown} colorPalette
	 * @returns {Readable<string[] | undefined>}
	 */
	resolveColorPalette = (colorPalette) => {
		if (typeof colorPalette === 'string') {
			const trimmed = colorPalette.trim();
			if (isBuiltinColorPalette(trimmed)) {
				return derived(this.#theme, ($theme) => $theme.colorPalettes[trimmed]);
			}
		}

		if (Array.isArray(colorPalette)) {
			return readable(colorPalette);
		}

		return readable(undefined);
	};

	/**
	 * @param {unknown} colorScale
	 * @returns {Readable<string[] | undefined>}
	 */
	resolveColorScale = (colorScale) => {
		if (typeof colorScale === 'string') {
			const trimmed = colorScale.trim();
			if (isBuiltinColorPalette(trimmed)) {
				return derived(this.#theme, ($theme) => $theme.colorScales[trimmed]);
			}
		}

		if (Array.isArray(colorScale)) {
			return readable(colorScale);
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

/**
 * @template T
 * @typedef {T | T[] | { [key: string]: T }} ValueOrArrayOrObject
 */
