import { expect } from 'vitest';

/**
 * Removes whitespace from the start of each line
 * @example
 * ```
 * no whitespace
 *   spaces
 * 		tabs
 * ```
 * becomes
 * ```
 * no whitespace
 * spaces
 * tabs
 * ```
 * @param {string} s
 * @returns {string} s with whitespace at the beginning of each line removed
 */
export const removeIndentation = (s) => s.replace(/^\s+/gm, '');

/**
 * Expects a and b to be equal, ignoring indentation
 * @example
 * ```js
 * expectEqualIgnoringIndentation(
 *   `  a\n\tb`,
 *   `a\nb`,
 * ) => true
 *
 * expectEqualIgnoringIndentation(
 *   `a\n\nb`,
 *   `a\nb`
 * ) => false
 * ```
 * @param {string} a
 * @param {string} b
 */
export const expectEqualIgnoringIndentation = (a, b) =>
	expect(removeIndentation(a)).toBe(removeIndentation(b));
