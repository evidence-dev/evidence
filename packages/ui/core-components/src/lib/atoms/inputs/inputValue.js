/**
 * Helpers for matching a `defaultValue` (or any other value written in markdown)
 * against a value that came out of a query.
 *
 * Component props written in markdown are *always* strings: `defaultValue=2026`
 * arrives as the string `"2026"`. Values coming from a query keep their SQL type,
 * so the same year arrives as the number `2026` (or a `bigint`, or a `Date`).
 * Comparing the two with `===` therefore never matches, the input is never set,
 * and every query that interpolates that input stays `noResolve` forever -- the
 * "Loading..." that never finishes.
 *
 * These helpers compare by value rather than by type, which is what a user writing
 * `defaultValue=2026` means.
 */

/**
 * @param {unknown} v
 * @returns {number | undefined}
 */
const toTime = (v) => {
	if (v instanceof Date) {
		const t = v.getTime();
		return Number.isNaN(t) ? undefined : t;
	}
	if (typeof v === 'string' || typeof v === 'number') {
		const t = new Date(v).getTime();
		return Number.isNaN(t) ? undefined : t;
	}
	return undefined;
};

/**
 * Reduce a value to the string a user would have typed for it in markdown.
 * @param {unknown} v
 * @returns {string}
 */
export const normalizeInputValue = (v) => {
	if (v instanceof Date) return v.toISOString();
	if (typeof v === 'bigint') return v.toString();
	if (typeof v === 'number') return String(v);
	if (typeof v === 'boolean') return v ? 'true' : 'false';
	return String(v);
};

/**
 * Loose, type-tolerant equality for input values.
 *
 * `null`/`undefined` only ever match themselves -- an unset value must not
 * accidentally match the empty string or `0`.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export const inputValuesMatch = (a, b) => {
	if (a === b) return true;
	if (a === null || a === undefined || b === null || b === undefined) return false;

	if (a instanceof Date || b instanceof Date) {
		const ta = toTime(a);
		const tb = toTime(b);
		return ta !== undefined && ta === tb;
	}

	return normalizeInputValue(a) === normalizeInputValue(b);
};
