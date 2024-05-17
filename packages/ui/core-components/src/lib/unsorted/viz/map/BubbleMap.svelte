<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Bubbles from './components/Bubbles.svelte';
	import BaseMap from './BaseMap.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';

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
	export let height = undefined; // height in pixels

	/** @type {string} */
	export let basemap = undefined;

	/** @type {string|undefined} */
	export let title = undefined;
</script>

{#if error}
	<ErrorChart {error} chartType="Bubble Map" />
{:else}
	<BaseMap {startingLat} {startingLong} {startingZoom} {height} {basemap} {title}>
		<Bubbles {data} {lat} {long} {size} {...$$restProps} />
	</BaseMap>
{/if}
