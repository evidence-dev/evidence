<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check

	import { getContext } from 'svelte';
	import { propKey, strictBuild } from '@evidence-dev/component-utilities/chartContext';

	/** @typedef {import("./datatable.store.js").ColumnConfig} ColumnConfig */

	/** @type {import("svelte/store").Writable<import("./datatable.store.js").DataTableProps>} */
	let props = getContext(propKey);

	let error;

	/** @type {ColumnConfig["identifier"]} */
	const identifier = Symbol();

	/** @type {ColumnConfig["id"]} */
	export let id;

	/**
	 * Check column name and handle error if doesn't exist
	 */
	function checkColumnName() {
		try {
			if (!Object.keys($props.data[0]).includes(id)) {
				error = 'Error in table: ' + id + ' does not exist in the dataset';
				throw new Error(error);
			}
		} catch (e) {
			error = e.message;
			if (strictBuild) {
				throw error;
			}
		}
	}

	/** @type {ColumnConfig["title"]} */
	export let title = undefined;
	/** @type {ColumnConfig["align"]} */
	export let align = undefined;
	if (align === 'centre') {
		align = 'center';
	}
	/** @type {ColumnConfig["wrap"] | string} */
	export let wrap = false;
	$: wrap = wrap === 'true' || wrap === true;

	/** @type {ColumnConfig["wrapTitle"] | string} */
	export let wrapTitle = false;
	$: wrapTitle = wrapTitle === 'true' || wrapTitle === true;

	// COLUMN CONTENT TYPES:
	/** @type {ColumnConfig["contentType"]} */
	export let contentType = undefined;

	// Images:
	/** @type {ColumnConfig["height"]} */
	export let height = undefined;
	/** @type {ColumnConfig["width"]} */
	export let width = undefined;
	/** @type {ColumnConfig["alt"]} */
	export let alt = undefined;

	// Links:
	/** @type {ColumnConfig["openInNewTab"] | string} */
	export let openInNewTab = false;
	$: openInNewTab = openInNewTab === 'true' || openInNewTab === true;

	/** @type {ColumnConfig["linkLabel"]} */
	export let linkLabel = undefined;

	// Formatting:
	/** @type {ColumnConfig["fmt"]} */
	export let fmt = undefined;

	// Totals:
	/** @type {ColumnConfig["totalAgg"]} */
	export let totalAgg = undefined;
	/** @type {ColumnConfig["totalFmt"]} */
	export let totalFmt = undefined;
	/** @type {ColumnConfig["weightCol"]} */
	export let weightCol = undefined; // column to use as the weights for weighted average

	// Subtotals:
	/** @type {ColumnConfig["subtotalFmt"]} */
	export let subtotalFmt = undefined;

	// Color Scale:
	/** @type {ColumnConfig["colorMax"]} */
	export let colorMax = undefined;
	/** @type {ColumnConfig["colorMin"]} */
	export let colorMin = undefined;
	/** @type {ColumnConfig["colorMid"]} */
	export let colorMid = undefined;
	/** @type {ColumnConfig["colorBreakpoints"]} */
	export let colorBreakpoints = undefined;
	/** @type {ColumnConfig["scaleColor"]} */
	export let scaleColor = 'green'; // name of predefined color palette, custom color, array of custom colors
	/** @type {ColumnConfig["scaleColumn"]} */
	export let scaleColumn = undefined;

	const colorList = {
		green: ['white', 'hsla(129, 33%, 57%,1)'],
		red: ['white', 'hsla(0, 56%, 56%,1)'],
		blue: ['white', 'hsla(198, 56%, 56%,1)']
	};

	/** @type {ColumnConfig["colorPalette"]} */
	let colorPalette;
	if (Array.isArray(scaleColor)) {
		colorPalette = scaleColor;
	} else if (!Object.hasOwn(colorList, scaleColor)) {
		colorPalette = ['white', scaleColor];
	} else {
		colorPalette = colorList[/** @type {keyof typeof colorList} */ (scaleColor)];
	}

	// Delta:
	/** @type {ColumnConfig["downIsGood"] | string} */
	export let downIsGood = false;
	$: downIsGood = downIsGood === 'true' || downIsGood === true;
	/** @type {ColumnConfig["showValue"] | string} */
	export let showValue = true;
	$: showValue = showValue === 'true' || showValue === true;
	/** @type {ColumnConfig["deltaSymbol"] | string} */
	export let deltaSymbol = true;
	$: deltaSymbol = deltaSymbol === 'true' || deltaSymbol === true;
	/** @type {ColumnConfig["neutralMin"]} */
	export let neutralMin = 0;
	/** @type {ColumnConfig["neutralMax"]} */
	export let neutralMax = 0;
	/** @type {ColumnConfig["chip"] | string} */
	export let chip = false;
	$: chip = chip === 'true' || chip === true;

	// Column Groups:
	/** @type {ColumnConfig["colGroup"]} */
	export let colGroup = undefined;

	// Formats defined in another column:
	/** @type {ColumnConfig["fmtColumn"]} */
	export let fmtColumn = undefined;

	// Neagtive value font color:
	/** @type {ColumnConfig["redNegatives"] | string} */
	export let redNegatives = false;
	$: redNegatives = redNegatives === 'true' || redNegatives === true;

	/** @type {import("./datatable.store.js").ColumnConfig} */
	let options;
	$: options = {
		identifier,
		id,
		title,
		align,
		wrap,
		wrapTitle,
		contentType,
		height,
		width,
		alt,
		openInNewTab,
		linkLabel,
		fmt,
		fmtColumn,
		totalAgg,
		totalFmt,
		subtotalFmt,
		weightCol,
		downIsGood,
		deltaSymbol,
		chip,
		neutralMin,
		neutralMax,
		showValue,
		colorMax,
		colorMin,
		scaleColor,
		scaleColumn,
		colGroup,
		colorMid,
		colorBreakpoints,
		colorPalette,
		redNegatives
	};

	/**
	 * Ensures that column props (e.g. title) are reflected in the table's state.
	 * Without this function, props are only used on first render, and are not reactive
	 * @returns {void}
	 */
	const updateProps = () => {
		// Simple check of column name in dataset. Should be replaced with robust error handling in the future:
		checkColumnName();

		props.update((d) => {
			const matchingIndex = d.columns.findIndex((c) => c.identifier === identifier);
			if (matchingIndex === -1) {
				d.columns.push(options);
			} else {
				d.columns = [
					...d.columns.slice(0, matchingIndex),
					options,
					...d.columns.slice(matchingIndex + 1)
				];
			}
			return d;
		});
	};
	$: options, updateProps();
</script>
