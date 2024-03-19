import { getContext, setContext } from 'svelte';
/**
 * @typedef {Object} ButtonGroupItem
 * @property {string} valueLabel
 * @property {string | boolean | number | Date} value
 */

const CONTEXT_KEY = '__EVIDENCE_BUTTON_GROUP_CONTEXT';

/**
 * @returns {{ update: (v: ButtonGroupItem) => void, value: import("svelte/store").Readable<ButtonGroupItem>}}
 */
export const getButtonGroupContext = () => getContext(CONTEXT_KEY);

/**
 * @param {(v: ButtonGroupItem) => void} update
 * @param {import("svelte/store").Readable<ButtonGroupItem>} value
 * @returns {void}
 */
export const setButtonGroupContext = (update, value) => setContext(CONTEXT_KEY, { update, value });

/**
 * @type {Record<string, ButtonGroupItem[]>}
 */
export const presets = {
	dates: [
		{ valueLabel: 'Week', value: '7 days' },
		{ valueLabel: 'Month', value: '1 month' },
		{ valueLabel: 'Year', value: '1 year' }
	]
};
