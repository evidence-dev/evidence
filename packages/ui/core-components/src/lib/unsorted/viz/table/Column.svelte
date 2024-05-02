<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';
	import { propKey, strictBuild } from '@evidence-dev/component-utilities/chartContext';

	let props = getContext(propKey);

	let error;

	export let id;

	// Simple check of column name in dataset. Should be replaced with robust error handling in the future:
	$: checkColumnName();

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

	export let title = undefined;
	export let align = undefined;
	if (align === 'centre') {
		align = 'center';
	}
	export let wrap = false;
	$: wrap = wrap === 'true' || wrap === true;

	export let wrapTitle = false;
	$: wrapTitle = wrapTitle === 'true' || wrapTitle === true;

	// COLUMN CONTENT TYPES:
	export let contentType = undefined;

	// Images:
	export let height = undefined;
	export let width = undefined;
	export let alt = undefined;

	// Links:
	export let openInNewTab = false;
	$: openInNewTab = openInNewTab === 'true' || openInNewTab === true;

	export let linkLabel = undefined;

	// Formatting:
	export let fmt = undefined;

	// Totals:
	export let totalAgg = undefined;
	export let totalFmt = undefined;
	export let weightCol = undefined; // column to use as the weights for weighted average

	// Subtotals:
	export let subtotalFmt = undefined;

	// Color Scale:
	export let colorMax = undefined;
	export let colorMin = undefined;
	export let colorMid = undefined;
	export let colorBreakpoints = undefined;
	export let scaleColor = 'green'; // name of predefined color palette, custom color, array of custom colors
	export let scaleColumn = undefined;

	let colorList = {
		green: ['white', 'hsla(129, 33%, 57%,1)'],
		red: ['white', 'hsla(0, 56%, 56%,1)'],
		blue: ['white', 'hsla(198, 56%, 56%,1)']
	};

	let colorPalette;
	if (scaleColor instanceof Array) {
		colorPalette = scaleColor;
	} else {
		colorPalette = colorList[scaleColor];
		if (colorPalette == undefined) {
			colorPalette = ['white', scaleColor];
		}
	}

	// Delta:
	export let downIsGood = false;
	$: downIsGood = downIsGood === 'true' || downIsGood === true;
	export let showValue = true;
	$: showValue = showValue === 'true' || showValue === true;
	export let deltaSymbol = true;
	$: deltaSymbol = deltaSymbol === 'true' || deltaSymbol === true;
	export let neutralMin = 0;
	export let neutralMax = 0;
	export let chip = false;
	$: chip = chip === 'true' || chip === true;

	// Column Groups:
	export let colGroup = undefined;

	// Formats defined in another column:
	export let fmtColumn = undefined;

	// Neagtive value font color:
	export let redNegatives = false;
	$: redNegatives = redNegatives === 'true' || redNegatives === true;

	$: options = {
		id: id,
		title: title,
		align: align,
		wrap: wrap,
		wrapTitle: wrapTitle,
		contentType: contentType,
		height: height,
		width: width,
		alt: alt,
		openInNewTab: openInNewTab,
		linkLabel: linkLabel,
		fmt: fmt,
		fmtColumn: fmtColumn,
		totalAgg: totalAgg,
		totalFmt: totalFmt,
		subtotalFmt: subtotalFmt,
		weightCol: weightCol,
		downIsGood: downIsGood,
		deltaSymbol: deltaSymbol,
		chip: chip,
		neutralMin: neutralMin,
		neutralMax: neutralMax,
		showValue: showValue,
		colorMax: colorMax,
		colorMin: colorMin,
		scaleColor: scaleColor,
		scaleColumn: scaleColumn,
		colGroup: colGroup,
		colorMid: colorMid,
		colorBreakpoints: colorBreakpoints,
		colorPalette: colorPalette,
		redNegatives: redNegatives
	};

	/**
	 * Ensures that column props (e.g. title) are reflected in the table's state.
	 * Without this function, props are only used on first render, and are not reactive
	 * @returns {void}
	 */
	const updateProps = () => {
		props.update((d) => {
			const matchingIndex = d.columns.findIndex((c) => c.id === id);
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
