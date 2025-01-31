<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Bubbles from './components/Bubbles.svelte';
	import BaseMap from './_BaseMap.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { getThemeStores } from '../../../themes/themes.js';
	import ErrorChart from '../core/ErrorChart.svelte';
	import { toBoolean } from '$lib/utils.js';

	const { resolveColorPalette } = getThemeStores();

	/** @type {'pass' | 'warn' | 'error' | undefined} */
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	let error;

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let data;
	if (!data) {
		error = 'data is required';
	}

	/** @type {string|undefined} */
	export let lat = undefined; // column containing lat values
	if (!lat) {
		error = 'lat is required (column containing latitude data)';
	}

	/** @type {string|undefined} */
	export let long = undefined; // column containing long values
	if (!long) {
		error = 'long is required (column containing longitude data)';
	}

	/** @type {number|undefined} */
	export let size = undefined; // point size
	if (!size) {
		error = 'size is required (column containing values representing the size of the bubbles)';
	}

	/** @type {number} */
	export let startingLat = undefined;
	/** @type {number} */
	export let startingLong = undefined;
	/** @type {number} */
	export let startingZoom = undefined;

	/** @type {number} */
	export let height = 300; // height in pixels

	/** @type {string} */
	export let basemap = undefined;

	/** @type {string|undefined} */
	export let title = undefined;

	/** @type {'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'} */
	export let legendPosition = 'bottomLeft';
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;

	/** @type {string[]|undefined} */
	export let colorPalette = undefined;
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	/** @type {boolean} */
	export let legend = true;

	/** @type {boolean} */
	export let ignoreZoom = false;
	$: ignoreZoom = toBoolean(ignoreZoom);

	/** @type {string|undefined} */
	export let attribution = undefined;

	const chartType = 'Bubble Map';

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = data?.hash === initialHash;
</script>

{#if !error}
	<BaseMap
		let:data
		{data}
		{startingLat}
		{startingLong}
		{startingZoom}
		{height}
		{basemap}
		{title}
		{legendPosition}
		{isInitial}
		{chartType}
		{emptySet}
		{emptyMessage}
		{error}
		{attribution}
	>
		<Bubbles
			{data}
			{lat}
			{long}
			{size}
			colorPalette={colorPaletteStore}
			{legendType}
			{legend}
			{ignoreZoom}
			{...$$restProps}
		/>
	</BaseMap>
{:else}
	<ErrorChart {error} title="Point Map" />
{/if}
