import { writable, get } from 'svelte/store';

/**
 * Global store for format settings that formatValue can read directly.
 * This is set by the root layout and read by formatValue without needing
 * to pass settings through every component.
 */
export const formatSettings = writable<{
	decimalSeparator: '.' | ',';
}>({
	decimalSeparator: '.'
});

/**
 * Get the current decimal separator setting.
 * Can be called from any function, not just Svelte components.
 */
export function getDecimalSeparator(): '.' | ',' {
	return get(formatSettings).decimalSeparator;
}
