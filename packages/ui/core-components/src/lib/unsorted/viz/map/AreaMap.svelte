<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Areas from './components/Areas.svelte';
	import BaseMap from './_BaseMap.svelte';
	import { Query } from '@evidence-dev/sdk/usql';

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

	/** @type {string} */
	export let geoJsonUrl = 'https://evd-geojson.b-cdn.net/ca_california_zip_codes_geo_1.min.json';

	/** @type {string|undefined} */
	export let geoId = undefined;

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
	export let height = 300; // height in pixels

	/** @type {string} */
	export let basemap = undefined;

	/** @type {string|undefined} */
	export let title = undefined;

	/** @type {'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'} */
	export let legendPosition = 'bottomLeft';
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;
	/** @type {boolean} */
	export let legend = true;

	/** @type {boolean} */
	export let ignoreZoom = false;

	/** @type {string|undefined} */
	export let attribution = undefined;

	const chartType = 'Area Map';

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = data?.hash === initialHash;
</script>

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
	{chartType}
	{isInitial}
	{emptySet}
	{emptyMessage}
	{error}
	{attribution}
>
	<Areas
		{data}
		{geoJsonUrl}
		{geoId}
		{areaCol}
		{legendType}
		{chartType}
		{legend}
		{ignoreZoom}
		{...$$restProps}
		on:error={(e) => (error = e.detail)}
	/>
</BaseMap>
