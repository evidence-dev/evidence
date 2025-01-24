<script>
	import { onMount } from 'svelte';
	/** @type {import("../EvidenceMap.js").EvidenceMap} */
	export let map = undefined;
	/** @type {object|undefined} */
	export let options = undefined;
	/** @type {object|undefined} */
	export let selectedOptions = undefined;
	/** @type {import('leaflet').LatLngExpression|undefined} */
	export let coords = undefined;
	/** @type {Function|undefined} */
	export let onclick = undefined;
	/** @type {Function|undefined} */
	export let setInput = undefined;
	/** @type {Function|undefined} */
	export let unsetInput = undefined;
	/** @type {Array<object>|undefined} */
	export let tooltip = undefined;
	/** @type {object|undefined} */
	export let tooltipOptions = undefined;
	/** @type {string|undefined} */
	export let tooltipType = undefined;
	/** @type {boolean|undefined} */
	export let showTooltip = undefined;
	/** @type {object|undefined} */
	export let item = undefined;
	/** @type {string|undefined} */
	export let link = undefined; // link column
	export let name = undefined;
	/** @type {boolean|undefined} */
	export let ignoreZoom = undefined;

	onMount(() => {
		const marker = map.addCircle(
			item,
			name,
			options,
			selectedOptions,
			coords,
			onclick,
			setInput,
			unsetInput,
			item[link],
			ignoreZoom
		);
		if (showTooltip) {
			const ttip = map.buildTooltip(item, tooltip);
			map.attachTooltip(marker, ttip, tooltipOptions, tooltipType);
		}
		return () => marker.remove();
	});
</script>
