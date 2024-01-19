<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';
	import { Item } from '$lib/atoms/shadcn/select/index.js';
	import { isInvisible } from './Invisible.svelte';

	export let value;
	export let valueLabel = value;

	const ctx = getContext('dropdown_context');

	// The first DropdownOption is the selected by default, but defaultValue overrides it
	if (!ctx.hasBeenSet || value === ctx.defaultValue) {
		ctx.setSelectedValue({ value, label: valueLabel });
		ctx.hasBeenSet = true;
	}

	const invisible = isInvisible();
</script>

{#if !invisible}
	<Item {value}>{valueLabel}</Item>
{/if}
