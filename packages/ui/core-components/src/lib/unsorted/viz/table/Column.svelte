<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onDestroy } from 'svelte';
	import { propKey, strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import { getThemeStores } from '../../../themes/themes.js';
	import { checkDeprecatedColor } from '../../../deprecated-colors.js';
	import { toBoolean } from '$lib/utils.js';

	const { resolveColor, resolveColorScale } = getThemeStores();

	let props = getContext(propKey);

	let error;

	const identifier = Symbol();
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

	export let description = undefined;

	// COLUMN CONTENT TYPES:
	export let contentType = undefined;

	export let title = undefined;
	export let align = undefined;
	if (align === 'centre') {
		align = 'center';
	}
	export let wrap = false;
	$: wrap = wrap === 'true' || wrap === true;

	export let wrapTitle = false;
	$: wrapTitle = wrapTitle === 'true' || wrapTitle === true;

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

	/** @deprecated Use colorScale instead */
	export let scaleColor = undefined;
	$: if (scaleColor) {
		console.warn('[Column] scaleColor is deprecated. Use colorScale instead.');
	}
	export let colorScale = 'default';
	$: _colorScale = checkDeprecatedColor('Column', 'colorScale', scaleColor ?? colorScale);
	$: colorScaleStore = resolveColorScale(_colorScale);

	export let scaleColumn = undefined;

	// Delta:
	export let downIsGood = false;
	$: downIsGood = toBoolean(downIsGood);
	export let showValue = true;
	$: showValue = toBoolean(showValue);
	export let deltaSymbol = true;
	$: deltaSymbol = toBoolean(deltaSymbol);
	export let neutralMin = 0;
	export let neutralMax = 0;
	export let chip = false;
	$: chip = toBoolean(chip);

	// Sparkline:
	export let sparkWidth = undefined;
	export let sparkHeight = undefined;
	export let sparkColor = undefined;
	export let sparkX = undefined;
	export let sparkY = undefined;
	export let sparkYScale = false;
	$: sparkYScale = toBoolean(sparkYScale);

	// Bar Viz:
	export let barColor = '#a5cdee';
	$: barColorStore = resolveColor(barColor);

	export let negativeBarColor = '#fca5a5';
	$: negativeBarColorStore = resolveColor(negativeBarColor);

	export let backgroundColor = 'transparent';
	$: backgroundColorStore = resolveColor(backgroundColor);

	export let hideLabels = false;
	$: hideLabels = toBoolean(hideLabels);

	// Column Groups:
	export let colGroup = undefined;

	// Formats defined in another column:
	export let fmtColumn = undefined;

	// Neagtive value font color:
	export let redNegatives = false;
	$: redNegatives = toBoolean(redNegatives);

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
		colorScale: $colorScaleStore,
		scaleColumn,
		colGroup,
		colorMid,
		colorBreakpoints,
		description,
		redNegatives,
		sparkWidth,
		sparkHeight,
		sparkColor,
		sparkX,
		sparkY,
		sparkYScale,
		barColor: $barColorStore,
		negativeBarColor: $negativeBarColorStore,
		backgroundColor: $backgroundColorStore,
		hideLabels
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

	onDestroy(() => {
		props.update((d) => {
			d.columns = d.columns.filter((c) => c.identifier !== identifier);
			return d;
		});
	});
</script>
