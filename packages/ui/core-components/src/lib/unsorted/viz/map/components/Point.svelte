<script>
	import { onMount } from 'svelte';
	/** @type {import("../EvidenceMap.js").EvidenceMap} */
	export let map = undefined;
	/** @type {object|undefined} */
	export let options = undefined;
	/** @type {import('leaflet').LatLngExpression|undefined} */
	export let coords = undefined;
	/** @type {Function|undefined} */
	export let onclick = undefined;
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

	onMount(() => {
		const marker = map.addCircle(options, coords, onclick, item[link]);
		if (showTooltip) {
			const ttip = map.buildTooltip(item, tooltip);
			map.attachTooltip(marker, ttip, tooltipOptions, tooltipType);
		}
		return () => marker.remove();
	});
</script>
