<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';

	export let value;
	export let valueLabel = value;
	let selected = false;

	// makes sure the first DropdownOption is the selected one
	const ctx = getContext('dropdown_context');
	if (!ctx.hasBeenSet) {
		ctx.setSelectedValue(value);
		if (ctx.defaultValue) {
			// Override selected value if default value set
			ctx.setSelectedValue(ctx.defaultValue);
			selected = value === ctx.defaultValue;
		}
		ctx.hasBeenSet = true;
	}
</script>

<option {selected}>{valueLabel}</option>
