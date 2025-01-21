<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { mapContextKey } from '../constants.js';
	import { getContext } from 'svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import MapArea from './MapArea.svelte';
	import { nanoid } from 'nanoid';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { getThemeStores } from '../../../../themes/themes.js';
	import { hydrateFromUrlParam, updateUrlParam } from '@evidence-dev/sdk/utils/svelte';
	const inputs = getInputContext();

	const { theme, resolveColor, resolveColorPalette } = getThemeStores();

	/** @type {import("../EvidenceMap.js").EvidenceMap | undefined} */
	const map = getContext(mapContextKey);

	if (!map) throw new Error('Evidence Map Context has not been set. Areas will not function');

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
	export let valueFmt = 'num0';
	/** @type {number|undefined} */
	export let min = undefined;
	/** @type {number|undefined} */
	export let max = undefined;
	/** @type {string|undefined} */
	export let link = undefined;

	/** @type {string | undefined} */
	export let name = undefined;
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;
	export let chartType = 'Area Map';

	/** @type {boolean} */
	export let legend = true;

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
	$: colorStore = resolveColor(color);

	/** @type {string} */
	export let borderColor = 'base-300';
	$: borderColorStore = resolveColor(borderColor);

	/** @type {string[]} */
	export let colorPalette = undefined;
	$: colorPaletteStore = resolveColorPalette(colorPalette);

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

	// Selected State Styling Options

	/** @type {number|undefined} */
	export let selectedBorderWidth = 1;
	// below step of converting to number is important, as accident strings cause bugs in leaflet rendering
	if (selectedBorderWidth) {
		// if borderWidth was user-supplied
		selectedBorderWidth = Number(selectedBorderWidth);
		if (isNaN(selectedBorderWidth)) {
			// input must be a number
			throw Error('selectedBorderWidth must be a number');
		} else if (selectedBorderWidth < 0) {
			throw Error('selectedBorderWidth cannot be negative');
		}
	} else {
		selectedBorderWidth = 0.75;
	}

	/** @type {string} */
	export let selectedColor = 'accent';
	$: selectedColorStore = resolveColor(selectedColor);

	/** @type {string} */
	export let selectedBorderColor = 'accent-content';
	$: selectedBorderColorStore = resolveColor(selectedBorderColor);

	/** @type {number|undefined} */
	export let selectedOpacity = undefined;
	if (selectedOpacity) {
		// if selectedOpacity was user-supplied
		selectedOpacity = Number(selectedOpacity);
		if (isNaN(selectedOpacity)) {
			// input must be a number
			throw Error('selectedOpacity must be a number');
		} else if (selectedOpacity < 0) {
			throw Error('selectedOpacity cannot be negative');
		}
	} else {
		selectedOpacity = 1;
	}

	/** @type {string | undefined} */
	export let selectedAreaClass = undefined; // User-defined styles

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

	/**
	 * Process the areas and filter the GeoJSON data.
	 * @returns {Promise<object[]>} The filtered GeoJSON features.
	 */
	async function processAreas() {
		const urlToLoad = geoJsonUrl;
		const geoJsonData = await map.loadGeoJson(urlToLoad);
		if (!geoJsonData) return;
		if (geoJsonUrl !== urlToLoad) return;
		const areaSet = new Set(data.map((d) => d[areaCol].toString())); // Ensure string format
		geoJson = geoJsonData?.features.filter((geo) => areaSet.has(geo.properties[geoId])); // Filter GeoJSON data
	}

	let values;
	let colorScale;
	let geoJson = [];
	let legendId = nanoid();
	let colorPaletteFinal;

	/**
	 * Initialize the component.
	 * @param {import('@evidence-dev/tailwind').Theme} theme
	 * @returns {Promise<void>}
	 */
	async function init(theme) {
		let initDataOptions = {
			corordinates: [areaCol],
			value,
			checkInputs,
			min,
			max,
			colorPalette: $colorPaletteStore,
			legendType,
			valueFmt,
			chartType,
			legendId,
			legend,
			theme
		};
		await data.fetch();
		if (!$colorStore) {
			({
				values,
				colorPalette: colorPaletteFinal,
				legendType,
				colorScale
			} = await map.initializeData(data, initDataOptions));
		}

		await processAreas();

		if (name && $data.length > 0) {
			setInputDefault($data[0], name);
		}
	}

	/**
	 * Initializes the input store with default values based on the keys of the item.
	 * Each key in the item will be set to true in the specified input store entry.
	 *
	 * @param {Object} item - The object whose keys will be used to set default values.
	 * @param {string} name - The key under which to store the defaults in the input store.
	 */
	function setInputDefault(item, name) {
		$inputs[name] = Object.fromEntries(Object.keys(item).map((key) => [key, true]));
		updateUrlParam(name, $inputs[name]);
	}

	/**
	 * Updates the input store with a new item under the specified name.
	 * This function directly assigns the item to the input store, replacing any existing value.
	 *
	 * @param {Object} item - The new data object to set in the store.
	 * @param {string} name - The store key under which to set the item.
	 */
	function updateInput(item, name) {
		$inputs[name] = Object.fromEntries(
			Object.entries(item).map(([key, value]) => [
				key,
				typeof value === 'string' ? value.replaceAll("'", "''") : value
			])
		);
		updateUrlParam(name, $inputs[name]);
	}

	/**
	 * Unsets an input in the store by deleting the entry and then reinitializing it
	 * with default values based on the provided item's keys, set to true.
	 *
	 * @param {Object} item - The object whose keys will be used to reset the default values after unset.
	 * @param {string} name - The key in the store to unset and then reset.
	 */
	function unsetInput(item, name) {
		inputs.update((values) => {
			if (Object.prototype.hasOwnProperty.call(values, name)) {
				delete values[name];
			}
			return values;
		});
		setInputDefault(item, name);
	}

	// Re-load areas when related props change
	$: geoJsonUrl,
		data,
		areaCol,
		(async () => {
			await data.fetch();
			await processAreas();
		})();
</script>

<!-- Additional data.fetch() included in await to trigger reactivity. Should ideally be handled in init() in the future. -->
{#await Promise.all([map.initPromise, data.fetch()]) then}
	{#await init($theme) then}
		{#each geoJson as feature (feature.properties[geoId])}
			{@const item = $data.find((d) => d[areaCol].toString() === feature.properties[geoId])}
			<MapArea
				{map}
				{feature}
				{item}
				{name}
				areaOptions={{
					fillColor:
						$colorStore ??
						map.handleFillColor(item, value, values, colorPaletteFinal, colorScale, $theme) ??
						colorScale(item[value]).hex(),
					fillOpacity: opacity,
					opacity: opacity,
					weight: borderWidth,
					color: $borderColorStore,
					className: `outline-none ${areaClass}`
				}}
				selectedAreaOptions={{
					fillColor: $selectedColorStore,
					fillOpacity: selectedOpacity,
					opacity: selectedOpacity,
					weight: selectedBorderWidth,
					color: $selectedBorderColorStore,
					className: `outline-none ${selectedAreaClass}`
				}}
				onclick={() => {
					onclick(item);
				}}
				setInput={() => {
					if (name) {
						updateInput(item, name);
					}
				}}
				unsetInput={() => {
					if (name) {
						unsetInput(item, name);
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
		{map.handleInternalError(e)}
	{/await}
{/await}
