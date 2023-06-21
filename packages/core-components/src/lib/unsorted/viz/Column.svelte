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

	let options = {
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
		fmt: fmt
	};

	props.update((d) => {
		d.columns.push(options);
		return d;
	});
</script>
