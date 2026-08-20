import { getContext, setContext } from 'svelte';
import type { Theme, ThemeConfig } from '../types/theme';
import { DEFAULT_THEME } from '../constants/default-theme';
import { buildThemes } from './build-themes';
import { mode } from 'mode-watcher';

const THEME_CONTEXT_KEY = Symbol('THEME_CONTEXT');

/**
 * Theme context - manages theme state and provides reactive access to theme tokens
 *
 * Receives an already-resolved theme (hierarchy resolution happens upstream)
 * Uses mode-watcher for light/dark detection to stay in sync with the rest of the app
 */
export class ThemeContext {
	#themeConfig = $state<ThemeConfig>(DEFAULT_THEME);

	// Use mode-watcher's mode for light/dark selection
	#activeAppearance = $derived<'light' | 'dark'>(mode.current ?? 'light');

	// Build light and dark theme variants
	#themes = $derived(buildThemes(this.#themeConfig));

	// Active theme based on current appearance mode
	#activeTheme = $derived<Theme>(this.#themes[this.#activeAppearance]);

	constructor(themeConfig: ThemeConfig) {
		this.#themeConfig = themeConfig;
	}

	/**
	 * Update the theme config - useful when data is invalidated and reloaded
	 */
	updateConfig(themeConfig: ThemeConfig) {
		this.#themeConfig = themeConfig;
	}

	// Getters
	get activeTheme(): Theme {
		return this.#activeTheme;
	}

	get themes() {
		return this.#themes;
	}

	/**
	 * Resolve a color scale with appropriate background context.
	 *
	 * Auto-expansion behavior:
	 * - If the effective scale has 1 color: Expand to [background, color] so it
	 *   reads as a gradient over the surface behind it (page or card).
	 * - If it has 2+ colors: Use as-is (author has full control).
	 * - If it's empty/undefined: Fall back to the theme's default scale (which
	 *   is itself run through the same expansion rule).
	 *
	 * `overrideScale` lets a component pass through an inline `color_palette=[...]`
	 * prop so a single-color inline value gets the same background-anchored
	 * gradient the theme-level default would.
	 *
	 * Always uses the active appearance mode.
	 *
	 * @param useCardBackground - Whether to use card background (for components inside cards)
	 * @param overrideScale - Optional inline scale to use instead of the theme default
	 * @returns Color scale, auto-expanded if needed
	 */
	getBackgroundAdjustedColorScale(
		useCardBackground: boolean = false,
		overrideScale?: string[]
	): string[] {
		const theme = this.#activeTheme;
		const rawScale =
			overrideScale && overrideScale.length > 0 ? overrideScale : theme.colorScales.default;

		if (!rawScale || rawScale.length === 0) {
			return [];
		}

		// ONLY expand if the effective scale has exactly 1 color
		if (rawScale.length === 1) {
			const bgColor = useCardBackground && theme.card ? theme.card.background : theme.background;
			return [bgColor, rawScale[0]];
		}

		// 2+ colors - use exactly what was specified
		return rawScale;
	}
}

/**
 * Set up theme context with a resolved theme
 * Resolution should happen upstream (server or layout)
 */
export function setThemeContext(themeConfig: ThemeConfig) {
	const context = new ThemeContext(themeConfig);
	setContext(THEME_CONTEXT_KEY, context);
	return context;
}

export function getThemeContext(): ThemeContext {
	const context = getContext<ThemeContext | undefined>(THEME_CONTEXT_KEY);
	if (!context) {
		// Return default theme context if not set
		return new ThemeContext(DEFAULT_THEME);
	}
	return context;
}
