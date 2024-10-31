<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Areas from './components/Areas.svelte';
	import BaseMap from './BaseMap.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';
	import EmptyChart from '../core/EmptyChart.svelte';
	import { QueryLoad } from '../../../atoms/query-load';
	import { Query } from '@evidence-dev/sdk/usql';
	import Skeleton from '../../../atoms/skeletons/Skeleton.svelte';

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
	export let height = undefined; // height in pixels

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

	const chartType = 'Area Map';

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	$: isInitial = data?.hash === initialHash;
</script>

<QueryLoad {data} let:loaded>
	<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
	<ErrorChart let:loaded slot="error" {chartType} error={error ?? loaded.error.message} />

	<!-- Override default skeleton to match height of map -->
	<div slot="skeleton" class="w-full" style="height: {height}px">
		<Skeleton />
	</div>

	<BaseMap {startingLat} {startingLong} {startingZoom} {height} {basemap} {title} {legendPosition}>
		<Areas
			data={loaded}
			{geoJsonUrl}
			{geoId}
			{areaCol}
			{legendType}
			{chartType}
			{legend}
			{...$$restProps}
		/>
	</BaseMap>
</QueryLoad>
