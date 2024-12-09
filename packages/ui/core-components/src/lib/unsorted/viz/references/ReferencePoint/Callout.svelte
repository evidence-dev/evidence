<!-- Callout is just a ReferencePoint with different default styling -->

<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check
	import ReferencePoint from './ReferencePoint.svelte';

	/** @type {'pass' | 'warn' | 'error' | undefined} */
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	/** @type {number | string | undefined} */
	export let x = undefined;

	/** @type {number | string | undefined} */
	export let y = undefined;

	/** @type {unknown} */
	export let data = undefined;

	/**
	 * @type {string}
	 * @default "base-content-muted"
	 */
	export let color = 'base-content-muted';

	/** @type {string | undefined} */
	export let label = undefined;

	/** @type {string | undefined} */
	export let labelColor = undefined;

	/**
	 * @type {number | "fit" | string | undefined}
	 * @default 80
	 */
	export let labelWidth = 80;

	/**
	 * @type {number | string | undefined}
	 * @default 5
	 */
	export let labelPadding = 8;

	/**
	 * @type {import('./types.js').LabelPosition}
	 * @default "top"
	 */
	export let labelPosition = 'top';

	/** @type {string} */
	export let labelBackgroundColor = 'base-100';

	/**
	 * @type {number | string | undefined}
	 * @default 1
	 */
	export let labelBorderWidth = 1;

	/**
	 * @type {number | string | undefined}
	 * @default 5
	 */
	export let labelBorderRadius = 4;

	/** @type {string | undefined} */
	export let labelBorderColor = 'base-300';

	/** @type {'solid' | 'dotted' | 'dashed' | undefined} */
	export let labelBorderType = undefined;

	/** @type {number | string | undefined} */
	export let fontSize = undefined;

	/** @type {'left' | 'center' | 'right' | undefined} */
	export let align = undefined;

	/** @type {boolean | undefined} */
	export let bold = undefined;

	/** @type {boolean | undefined} */
	export let italic = undefined;

	/**
	 * @type {import('../types.js').Symbol}
	 * @default "circle"
	 */
	export let symbol = 'circle';

	/** @type {string | undefined} */
	export let symbolColor = undefined;

	/**
	 * @type {number | string}
	 * @default 8
	 */
	export let symbolSize = 8;

	/** @type {number | string | undefined} */
	export let symbolOpacity = undefined;

	/** @type {number | string | undefined} */
	export let symbolBorderWidth = undefined;

	/** @type {string | undefined} */
	export let symbolBorderColor = undefined;

	/**
	 * @type {boolean}
	 * @default false
	 */
	export let preserveWhitespace = false;
</script>

<ReferencePoint
	chartType="Callout"
	{emptySet}
	{emptyMessage}
	{x}
	{y}
	{data}
	{color}
	{label}
	{labelColor}
	{labelWidth}
	{labelPadding}
	{labelPosition}
	{labelBackgroundColor}
	{labelBorderWidth}
	{labelBorderRadius}
	{labelBorderColor}
	{labelBorderType}
	{fontSize}
	{align}
	{bold}
	{italic}
	{symbol}
	{symbolColor}
	{symbolSize}
	{symbolOpacity}
	{symbolBorderWidth}
	{symbolBorderColor}
	{preserveWhitespace}
>
	<slot />
</ReferencePoint>
