<script>
	import { onMount } from 'svelte';
	/** @type {import("../EvidenceMap.js").EvidenceMap} */
	export let map = undefined;
	/** @type {object|undefined} */
	export let feature = undefined;
	/** @type {object|undefined} */
	export let areaOptions = undefined;
	/** @type {object|undefined} */
	export let selectedAreaOptions = undefined;
	/** @type {Function|undefined} */
	export let onclick = undefined;
	/** @type {Function|undefined} */
	export let setInput = undefined;
	/** @type {Function|undefined} */
	export let unsetInput = undefined;
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
	export let name = undefined;
	/** @type {boolean|undefined} */
	export let ignoreZoom = undefined;

	onMount(() => {
		const area = map.addArea(
			item,
			name,
			feature,
			areaOptions,
			selectedAreaOptions,
			onclick,
			setInput,
			unsetInput,
			item[link],
			ignoreZoom
		);
		if (showTooltip) {
			const ttip = map.buildTooltip(item, tooltip);
			map.attachTooltip(area, ttip, tooltipOptions, tooltipType);
		}
		return () => area.remove();
	});
</script>
