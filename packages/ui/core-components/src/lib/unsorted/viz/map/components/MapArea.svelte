<script>
	import { onMount } from 'svelte';
	/** @type {import("../EvidenceMap.js").EvidenceMap} */
	export let map = undefined;
	/** @type {object|undefined} */
	export let feature = undefined;
	/** @type {object|undefined} */
	export let areaOptions = undefined;
	/** @type {Function|undefined} */
	export let onclick = undefined;
	/** @type {object|undefined} */
	export let item = undefined;
	/** @type {Array<object>|undefined} */
	export let tooltip = undefined;
	/** @type {object|undefined} */
	export let tooltipOptions = undefined;
	/** @type {string|undefined} */
	export let tooltipType = undefined;
	/** @type {boolean|undefined} */
	export let showTooltip = undefined;
	/** @type {string|undefined} */
	export let link = undefined; // link column

	onMount(() => {
		const area = map.addArea(feature, areaOptions, onclick, item[link]);
		if (showTooltip) {
			const ttip = map.buildTooltip(item, tooltip);
			map.attachTooltip(area, ttip, tooltipOptions, tooltipType);
		}
		return () => area.remove();
	});
</script>
