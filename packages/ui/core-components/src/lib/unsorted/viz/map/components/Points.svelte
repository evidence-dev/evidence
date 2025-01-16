<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { mapContextKey } from '../constants.js';
	import { getContext } from 'svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import Point from './Point.svelte';
	import { getColumnExtentsLegacy } from '@evidence-dev/component-utilities/getColumnExtents';

	/** @type {import("../EvidenceMap.js").EvidenceMap | undefined} */
	const map = getContext(mapContextKey);

	if (!map) throw new Error('Evidence Map Context has not been set. Points will not function');

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { getThemeStores } from '../../../../themes/themes.js';
	import { nanoid } from 'nanoid';

	const { theme, resolveColor, resolveColorPalette } = getThemeStores();

	const inputs = getInputContext();

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let data;

	/** @type {string|undefined} */
	export let lat = undefined; // column containing lat values
	/** @type {string|undefined} */
	export let long = undefined; // column containing long values
	/** @type {string|undefined} */
	export let value = undefined; // column with the value to be represented
	/** @type {string|undefined} */
	export let valueFmt = 'num0';
	/** @type {string|undefined} */
	export let sizeFmt = 'num0';
	/** @type {number|undefined} */
	export let size = undefined; // point size
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;
	/** @type {'Point Map' | 'Bubble Map'} */
	export let chartType = 'Point Map';

	/** @type {boolean} */
	export let legend = true;

	if (size) {
		// if size was user-supplied
		size = Number(size);
		if (isNaN(size)) {
			// input must be a number
			throw Error('size must be a number');
		} else if (size < 0) {
			throw Error('size cannot be negative');
		}
	} else {
		size = 5;
	}

	/** @type {string|undefined} */
	export let sizeCol = undefined; // column containing values representing bubble size

	/** @type {number|undefined} */
	export let min = undefined;
	/** @type {number|undefined} */
	export let max = undefined;

	/** @type {string|undefined} */
	export let link = undefined;

	/** @type {string|undefined} */
	export let pointName = undefined; // column containing point name/title

	/** @type {string | undefined} */
	export let name = undefined;

	/** @type {Function} */
	export let onclick = () => {};

	/** @type {number|undefined} */
	export let borderWidth = undefined;
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

	/** @type {string} */
	export let borderColor = 'white';
	$: borderColorStore = resolveColor(borderColor);

	/** @type {string|undefined} */
	export let color = undefined;
	$: colorStore = resolveColor(color);

	/** @type {string[] | undefined} */
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
		opacity = 1;
	}

	/** @type {string | undefined} */
	export let pointClass = undefined; // User-defined styles

	// Selected point styling options:

	/** @type {number|undefined} */
	export let selectedBorderWidth = undefined;
	if (selectedBorderWidth) {
		// if selectedBorderWidth was user-supplied
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
	export let selectedPointClass = undefined; // User-defined styles

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
		if (pointName) {
			tooltip.push({ id: pointName, showColumnName: false, valueClass: 'font-bold text-sm' });
		}
		if (value) {
			tooltip.push({ id: value, fmt: valueFmt });
		}
		if (sizeCol && sizeCol !== value) {
			tooltip.push({ id: sizeCol, fmt: sizeFmt });
		}
	}

	if (tooltip.length === 0) {
		// If empty (pointName and value not set), hide tooltip
		showTooltip = false;
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

	/** @type {number} */
	export let maxSize = 25;

	/**
	 * Determine bubble sizes.
	 * @param {number} newPoint - The new point value.
	 * @returns {number} - The size of the bubble.
	 */
	function bubbleSize(newPoint) {
		return Math.sqrt((newPoint / maxData) * maxSizeSq);
	}

	let values, colorScale, sizeExtents, maxData, maxSizeSq, colorPaletteFinal;

	/** @type {'bubble' | 'points' }*/
	export let pointStyle = 'points';

	/** @type {string}*/
	let legendId = map.registerPane(nanoid());

	/**
	 * Initialize the component.
	 * @param {import('@evidence-dev/tailwind').Theme} theme
	 * @returns {Promise<void>}
	 */
	async function init(theme) {
		if (data) {
			let initDataOptions = {
				corordinates: [lat, long],
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
			({
				values,
				colorPalette: colorPaletteFinal,
				colorScale
			} = await map.initializeData(data, initDataOptions));

			if (sizeCol) {
				sizeExtents = getColumnExtentsLegacy(data, sizeCol);
				maxData = sizeExtents[1];
				maxSizeSq = Math.pow(maxSize, 2);
			}

			if (name && $data.length > 0) {
				setInputDefault($data[0], name);
			}
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
</script>

<!-- Additional data.fetch() included in await to trigger reactivity. Should ideally be handled in init() in the future. -->
{#await Promise.all([map.initPromise, data.fetch(), init($theme)]) then}
	{#each $data as item}
		<Point
			{map}
			options={{
				// kw note:
				//need to clean this logic
				fillColor:
					$colorStore ??
					map.handleFillColor(item, value, values, colorPaletteFinal, colorScale, $theme),
				radius: sizeCol ? bubbleSize(item[sizeCol]) : size, // Radius of the circle in meters
				fillOpacity: opacity,
				opacity: opacity,
				weight: borderWidth,
				color: $borderColorStore,
				className: `outline-none ${pointClass}`,
				markerType: pointStyle,
				pane: legendId
			}}
			selectedOptions={{
				fillColor: $selectedColorStore,
				fillOpacity: selectedOpacity,
				opacity: selectedOpacity,
				weight: selectedBorderWidth,
				color: $selectedBorderColorStore,
				className: `outline-none ${selectedPointClass}`
			}}
			coords={[item[lat], item[long]]}
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
			{item}
			{link}
			{showTooltip}
		/>
	{/each}
{:catch e}
	{map.handleInternalError(e)}
{/await}
