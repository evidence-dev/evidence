import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';

/**
 * Merges and concatenates CSS class names.
 * @param {...ClassValue[]} inputs - The class values to merge.
 * @returns {string} The merged class names.
 */
export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * @typedef {Object} FlyAndScaleParams
 * @property {number} [y=0] - The vertical offset for the transition.
 * @property {number} [x=0] - The horizontal offset for the transition.
 * @property {number} [start=0.95] - The initial scale value for the transition.
 * @property {number} [duration=150] - The duration of the transition in milliseconds.
 */

/**
 * Creates a transition configuration for a fly and scale animation.
 * @param {Element} node - The DOM element to apply the transition to.
 * @param {FlyAndScaleParams} [params={}] - The parameters for the transition.
 * @returns {import('svelte/transition').TransitionConfig} The transition configuration.
 */
export const flyAndScale = (node, params = { y: -8, x: 0, start: 0.95, duration: 150 }) => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA, scaleA, scaleB) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;
		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;
		return valueB;
	};

	const styleToString = (style) => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);
			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

/**
 * @param {unknown} value
 * @returns {number | undefined}
 */
export const toNumber = (value) => {
	if (typeof value === 'undefined') return undefined;
	return Number(value);
};

/**
 * @param {unknown} value
 * @returns {boolean | undefined}
 */
export const toBoolean = (value) => {
	if (typeof value === 'undefined') return undefined;
	if (typeof value === 'string') {
		if (value.toLowerCase() === 'true') return true;
		if (value.toLowerCase() === 'false') return false;
	}
	return Boolean(value);
};

/**
 * Processes a dimension value to ensure it is in a valid CSS format.
 *
 * If the input is a plain number (e.g., "10"), "px" is appended to it.
 * If the input is already in a valid format (e.g., "10px", "5em", "auto"), it is returned as-is.
 * If the input is falsy, an empty string is returned.
 *
 * @param {string | number | undefined} dimension - The dimension value to process.
 * @returns {string} The processed dimension with "px" appended if it's a number, or the original value.
 */
export const processDimension = (dimension) => {
	if (!dimension) return ''; // No dimension provided
	return /^\d+$/.test(dimension) ? `${dimension}px` : dimension; // Add 'px' if it's a number
};
