<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onMount } from 'svelte';
	import { DropdownContext } from './constants.js';

	export let value;
	export let valueLabel = value;
	/** @type {number} */
	export let idx = -1;

	/** @type {import("./constants.js").EvidenceDropdownContext} */
	const dropdownContext = getContext(DropdownContext);
	onMount(() => dropdownContext.registerOption({ value, label: valueLabel, idx }));
</script>
