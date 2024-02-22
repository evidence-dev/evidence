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

	export let description = undefined;

	export let columnTitles = undefined;
	

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
	let customColor = undefined;
	if (useColor == undefined) {
		customColor = scaleColor;
	}



	$: options = {
		id: id,
		description: description,
		columnTitles: columnTitles,
		fmt: fmt,
		colorMax: colorMax,
		colorMin: colorMin,
		useColor: useColor,
		customColor: customColor
	};

	/**
	 * Ensures that row props (e.g. description) are reflected in the table's state.
	 * Without this function, props are only used on first render, and are not reactive
	 * @returns {void}
	 */
	const updateProps = () => {
		props.update((d) => {
			const matchingIndex = d.metricRows.findIndex((c) => c.id === id);
			if (matchingIndex === -1) {
				d.metricRows.push(options);
			} else {
				d.metricRows = [
					...d.metricRows.slice(0, matchingIndex),
					options,
					...d.metricRows.slice(matchingIndex + 1)
				];
			}
			return d;
		});
	};
	$: options, updateProps();
</script>
