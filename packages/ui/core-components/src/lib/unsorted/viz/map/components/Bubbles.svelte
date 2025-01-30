<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getThemeStores } from '../../../../themes/themes.js';
	import { toBoolean } from '../../../../utils.js';
	import Points from './Points.svelte';

	const { resolveColorPalette } = getThemeStores();

	/** @type {string|undefined} */
	export let size = undefined; // column containing size data
	/** @type {number} */
	export let opacity = 0.8;
	/** @type {'bubble' | 'points' }*/
	export let pointStyle = 'bubbles';
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;

	/** @type {boolean} */
	export let ignoreZoom = false;
	$: ignoreZoom = toBoolean(ignoreZoom);

	export let colorPalette = undefined;
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	/** @type {boolean} */
	export let legend = true;
	$: legend = toBoolean(legend);
</script>

<Points
	sizeCol={size}
	{opacity}
	{legendType}
	colorPalette={colorPaletteStore}
	{legend}
	{pointStyle}
	{ignoreZoom}
	{...$$restProps}
/>
