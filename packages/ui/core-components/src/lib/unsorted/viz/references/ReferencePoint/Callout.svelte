<!-- Callout is just a ReferencePoint with different default styling -->

<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check
	import ReferencePoint from './ReferencePoint.svelte';

	/** @type {'pass' | 'warn' | 'error'} */
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
	 * @type {import('../colors.js').Color}
	 * @default "grey"
	 */
	export let color = 'grey';

	/** @type {string | undefined} */
	export let label = undefined;

	/** @type {import('../colors.js').Color | undefined} */
	export let labelColor = undefined;

	/**
	 * @type {number | string | undefined}
	 * @default 200
	 */
	export let labelWidth = 200;

	/**
	 * @type {number | string | undefined}
	 * @default 5
	 */
	export let labelPadding = 5;

	/**
	 * @type {import('./reference-point.d.ts').LabelPosition}
	 * @default "top"
	 */
	export let labelPosition = 'top';

	/**
	 * @type {string}
	 * @default "white"
	 */
	export let labelBackgroundColor = 'white';

	/**
	 * @type {number | string | undefined}
	 * @default 1
	 */
	export let labelBorderWidth = 1;

	/**
	 * @type {number | string | undefined}
	 * @default 5
	 */
	export let labelBorderRadius = 5;

	/**
	 * @type {string | undefined}
	 * @default "gray"
	 */
	export let labelBorderColor = 'gray';

	/** @type {'solid' | 'dotted' | 'dashed' | undefined} */
	export let labelBorderType = undefined;

	/**
	 * @type {'always' | 'hover'}
	 * @default "always"
	 */
	export let labelVisible = 'always';

	/** @type {number | string | undefined} */
	export let fontSize = undefined;

	/**
	 * @type {'left' | 'center' | 'right' | undefined}
	 * @default "left"
	 */
	export let align = 'left';

	/** @type {boolean | undefined} */
	export let bold = undefined;

	/** @type {boolean | undefined} */
	export let italic = undefined;

	/**
	 * @type {import('./reference-point.d.ts').Symbol}
	 * @default "circle"
	 */
	export let symbol = 'circle';

	/** @type {import('../colors.js').Color | undefined} */
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
	{labelVisible}
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
