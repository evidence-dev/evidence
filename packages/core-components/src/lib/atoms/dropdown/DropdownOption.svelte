<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';

	export let value;
	export let label = value;

	// makes sure the first DropdownOption is the selected one
	const ctx = getContext('dropdown_context');
	if (!ctx.hasBeenSet) {
		ctx.setSelectedValue(value);
		ctx.hasBeenSet = true;
	}
</script>

<option {value}>{label}</option>
