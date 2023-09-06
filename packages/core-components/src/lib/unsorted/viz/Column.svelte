<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';
	import { propKey, strictBuild } from './context';

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
	wrap = wrap === 'true' || wrap === true;

	// COLUMN CONTENT TYPES:
	export let contentType = undefined;

	// Images:
	export let height = undefined;
	export let width = undefined;
	export let alt = undefined;

	// Links:
	export let openInNewTab = false;
	openInNewTab = openInNewTab === 'true' || openInNewTab === true;

	export let linkLabel = undefined;

	// Formatting:
	export let fmt = undefined;

	// Color Scale:
	export let colorMax = undefined;
	export let colorMin = undefined;
	export let scaleColor = 'green';

	let colorList = {
		green: 'hsla(129, 33%, 57%,',
		red: 'hsla(0, 56%, 56%,',
		blue: 'hsla(198, 56%, 56%,'
	};

	let useColor = colorList[scaleColor];

	// Delta:
	export let downIsGood = false;
	downIsGood = downIsGood === 'true' || downIsGood === true;
	export let showValue = true;
	showValue = showValue === 'true' || showValue === true;

	export let deltaSymbol = true;
	deltaSymbol = deltaSymbol === 'true' || deltaSymbol === true;

	$: options = {
		id: id,
		title: title,
		align: align,
		wrap: wrap,
		contentType: contentType,
		height: height,
		width: width,
		alt: alt,
		openInNewTab: openInNewTab,
		linkLabel: linkLabel,
		fmt: fmt,
		downIsGood: downIsGood,
		deltaSymbol: deltaSymbol,
		showValue: showValue,
		colorMax: colorMax,
		colorMin: colorMin,
		useColor: useColor
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
