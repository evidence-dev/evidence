<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { mapContextKey } from '../constants.js';
	import { getContext } from 'svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import chroma from 'chroma-js';
	import MapArea from './MapArea.svelte';
	import { uiColours } from '@evidence-dev/component-utilities/colours';
	import ErrorChart from '../../core/ErrorChart.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';

	/** @type {import("../EvidenceMap.js").EvidenceMap | undefined} */
	const map = getContext(mapContextKey);

	if (!map) throw new Error('Evidence Map Context has not been set. Areas will not function');

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let data;
	/** @type {string} */
	export let geoJsonUrl = 'https://evd-geojson.b-cdn.net/ca_california_zip_codes_geo_1.min.json'; // URL to the GeoJSON file
	/** @type {string|undefined} */
	export let areaCol = undefined;
	/** @type {string|undefined} */
	export let geoId = undefined;
	/** @type {string|undefined} */
	export let value = undefined;
	/** @type {string|undefined} */
	export let valueFmt = undefined;
	/** @type {number|undefined} */
	export let min = undefined;
	/** @type {number|undefined} */
	export let max = undefined;
	/** @type {string|undefined} */
	export let link = undefined;

	/** @type {string | undefined} */
	export let name = undefined;

	/**
	 * Callback function for the area click event.
	 * @type {(item: any) => void}
	 */
	export let onclick = () => {};

	/** @type {number|undefined} */
	export let borderWidth = undefined;
	// below step of converting to number is important, as accident strings cause bugs in leaflet rendering
	if (borderWidth) {
		// if borderWidth was user-supplied
		borderWidth = Number(borderWidth);
		if (isNaN(borderWidth)) {
			// input must be a number
			throw Error('borderWidth must be a number');
		} else if (borderWidth < 0) {
			throw Error('borderWidth cannot be negative');
		}
	} else {
		borderWidth = 0.75;
	}

	/** @type {string|undefined} */
	export let color = undefined;
	/** @type {string} */
	export let borderColor = uiColours.grey300;
	/** @type {string[]} */
	export let colorPalette = [uiColours.blue200, uiColours.blue999];

	/** @type {number|undefined} */
	export let opacity = undefined;
	if (opacity) {
		// if opacity was user-supplied
		opacity = Number(opacity);
		if (isNaN(opacity)) {
			// input must be a number
			throw Error('opacity must be a number');
		} else if (opacity < 0) {
			throw Error('opacity cannot be negative');
		}
	} else {
		opacity = 0.9;
	}

	/** @type {string | undefined} */
	export let areaClass = undefined; // User-defined styles

	/** @type {boolean} */
	export let showTooltip = true;

	/**
	 * @typedef {Object} TooltipItem
	 * @property {string} id - The ID of the data field.
	 * @property {boolean} [showColumnName] - Whether to show the column name.
	 * @property {string} [valueClass] - The CSS class for the value.
	 * @property {string} [fieldClass] - The CSS class for the field.
	 * @property {string} [fmt] - The format for the value.
	 * @property {string} [contentType] - The content type, default is 'text'.
	 */

	/** @type {TooltipItem[]} */
	export let tooltip = [];

	if (tooltip.length === 0) {
		if (areaCol) {
			tooltip.push({
				id: areaCol,
				showColumnName: false,
				valueClass: 'font-bold text-sm',
				fmt: 'id'
			});
		}
		if (value) {
			tooltip.push({ id: value, fmt: valueFmt });
		}
	}

	/** @type {string | undefined} */
	export let tooltipClass = undefined; // User-defined styles
	/** @type {string} */
	export let tooltipType = 'hover'; // click or hover

	/** @type {object} */
	const tooltipOptions = {
		permanent: false, // Tooltip will only show on hover
		direction: 'auto', // Automatically determines the best direction for the tooltip
		sticky: true, // Tooltip follows the mouse
		opacity: 1, // Opacity of the tooltip
		className: `${tooltipClass}`,
		interactive: true
	};

	let geoJsonData;
	// let error = undefined;

	/**
	 * Load the GeoJSON data from the URL.
	 * @returns {Promise<void>}
	 */
	async function loadGeoJson() {
		try {
			const response = await fetch(geoJsonUrl);
			geoJsonData = await response.json();
		} catch (e) {
			console.error('Failed to load GeoJSON:', e);
			// error = e.toString();
		}
	}

	/**
	 * Process the areas and filter the GeoJSON data.
	 * @returns {object[]} The filtered GeoJSON features.
	 */
	function processAreas() {
		if (!geoJsonData) return;
		const areaSet = new Set(data.map((d) => d[areaCol].toString())); // Ensure string format
		const filteredGeoJson = geoJsonData.features.filter((geo) =>
			areaSet.has(geo.properties[geoId])
		); // Filter GeoJSON data

		return filteredGeoJson;
	}

	let values, colorScale, filteredGeoJson;

	/**
	 * Initialize the component.
	 * @returns {Promise<void>}
	 */
	async function init() {
		await data.fetch();

		checkInputs(data, [areaCol]);

		values = $data.map((d) => d[value]);

		colorScale = chroma
			.scale(colorPalette)
			.domain([min ?? Math.min(...values), max ?? Math.max(...values)]);

		filteredGeoJson = processAreas();
	}
</script>

{#await Promise.all([map.initPromise, loadGeoJson()]) then}
	{#await Promise.all([init()]) then}
		{#each filteredGeoJson as feature}
			<MapArea
				{map}
				{feature}
				item={$data.find((d) => d[areaCol].toString() === feature.properties[geoId])}
				areaOptions={{
					fillColor:
						color ??
						colorScale(
							$data.find((d) => d[areaCol].toString() === feature.properties[geoId])[value]
						).hex(),
					fillOpacity: opacity,
					opacity: opacity,
					weight: borderWidth,
					color: borderColor,
					className: `outline-none ${areaClass}`
				}}
				onclick={() => {
					onclick($data.find((d) => d[areaCol].toString() === feature.properties[geoId]));
					if (name) {
						$inputs[name] = $data.find((d) => d[areaCol].toString() === feature.properties[geoId]);
					}
				}}
				{tooltip}
				{tooltipOptions}
				{tooltipType}
				{showTooltip}
				{link}
			/>
		{/each}
	{:catch e}
		<ErrorChart error={e} chartType="Area Map" />
	{/await}
{/await}
