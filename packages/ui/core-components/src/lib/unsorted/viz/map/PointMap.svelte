<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Points from './components/Points.svelte';
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
	<ErrorChart {error} chartType="Point Map" />
{:else}
	<BaseMap {startingLat} {startingLong} {startingZoom} {height} {basemap} {title}>
		<Points {data} {lat} {long} {...$$restProps} />
	</BaseMap>
{/if}
