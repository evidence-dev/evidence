import { mode } from 'mode-watcher';

/**
 * This is a placeholder for our future themes implementation where the user defines their own custom theme
 *
 * These values are copied from our colors defined in app.css
 *
 * The values here will likely be the default values in the user's theme and they will be able to customize them to
 * match their organization/project branding requirements
 */
const userThemeSpec = {
	light: {
		background: 'rgb(255 255 255)',
		foreground: 'rgb(9 9 11)',
		muted: 'rgb(244 244 245)',
		'muted-foreground': 'rgb(113 113 123)',
		border: 'rgb(228 228 231)'
	},
	dark: {
		background: 'rgb(9 9 11)',
		foreground: 'rgb(250 250 250)',
		muted: 'rgb(39 39 42)',
		'muted-foreground': 'rgb(159 159 169)',
		border: 'rgb(255 255 255 / 0.1)'
	}
} as const;

const current = $derived(mode.current === 'dark' ? userThemeSpec.dark : userThemeSpec.light);

export const userTheme = {
	get current() {
		return current;
	}
};
