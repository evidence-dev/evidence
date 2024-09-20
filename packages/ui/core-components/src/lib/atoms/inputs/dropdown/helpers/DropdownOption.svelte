<script context="module">
	export const evidenceInclude = true;

	let manualIdx = 0;
</script>

<script>
	import { getContext, onDestroy, onMount } from 'svelte';
	import { DropdownContext } from '../constants.js';
	import { browser } from '$app/environment';
	export let value;
	export let valueLabel = value;
	/** @type {number} */
	export let idx = -1;

	/**
	 * For internal use only
	 */
	export let __auto = false;

	if (!__auto) {
		idx = manualIdx++;
	}

	/** @type {import("../constants.js").EvidenceDropdownContext} */
	const dropdownContext = getContext(DropdownContext);
	if (!browser) {
		onDestroy(dropdownContext.registerOption({ value, label: valueLabel, idx, __auto }));
	}
	onMount(() => dropdownContext.registerOption({ value, label: valueLabel, idx, __auto }));
</script>
