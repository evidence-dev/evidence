<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Areas from './components/Areas.svelte';
	import BaseMap from './BaseMap.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';

	/** @type {string|undefined} */
	export let geoId = undefined;
	let error;

	if (!geoId) {
		error =
			'geoId is required. This is the name of the field in your geoJSON file which identifies the area/feature';
	}

	/** @type {string|undefined} */
	export let areaCol = undefined;
	if (!areaCol) {
		error =
			'areaCol is required. This is the name of the column in your query result which contains the identifier for the area you want to map';
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
	<ErrorChart {error} chartType="Area Map" />
{:else}
	<BaseMap {startingLat} {startingLong} {startingZoom} {height} {basemap} {title}>
		<Areas {geoId} {areaCol} {...$$restProps} />
	</BaseMap>
{/if}
