import { getContext, setContext } from 'svelte';
/** 
 * @typedef {Object} ButtonGroupItem
 * @property {string} label
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
export const setButtonGroupContext = (update, value) => setContext(CONTEXT_KEY, {update, value});
