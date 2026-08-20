import type { Theme } from '../types/theme';

/**
 * Get a token value from theme, automatically selecting between card and page context
 * Reduces duplication in components that need to handle both contexts
 *
 * @param theme - The theme object
 * @param token - Which token to get
 * @param useCardColors - Whether to use card colors (when inside a card)
 * @returns The appropriate color value
 */
export function getThemeToken(
	theme: Theme,
	token: 'background' | 'foreground' | 'mutedForeground' | 'border' | 'muted',
	useCardColors: boolean = false
): string {
	if (useCardColors && theme.card) {
		return theme.card[token];
	}
	return theme[token];
}
