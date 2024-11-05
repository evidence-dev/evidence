<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Points from './components/Points.svelte';
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
	export let height = 300; // height in pixels

	/** @type {string} */
	export let basemap = undefined;

	/** @type {string|undefined} */
	export let title = undefined;

	/** @type {string[]|undefined} */
	export let colorPalette = undefined;

	/** @type {'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'} */
	export let legendPosition = 'bottomLeft';
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;

	/** @type {boolean} */
	export let legend = true;

	const chartType = 'Point Map';

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
	{isInitial}
	{chartType}
	{emptySet}
	{emptyMessage}
	{error}
>
	<Points {data} {lat} {long} {colorPalette} {legendType} {chartType} {...$$restProps} {legend} />
</BaseMap>
