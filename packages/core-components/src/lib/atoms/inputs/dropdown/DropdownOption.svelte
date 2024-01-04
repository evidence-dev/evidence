<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';

	export let value;
	export let valueLabel = value;
	let selected = false;

	// The first DropdownOption is the selected by default
	const ctx = getContext('dropdown_context');
	if (!ctx.hasBeenSet) {
		ctx.setSelectedValue(value);
		if (ctx.defaultValue) {
			// Override selected value if default value is overridden
			ctx.setSelectedValue(ctx.defaultValue);
			selected = value === ctx.defaultValue;
		}
		ctx.hasBeenSet = true;
	}
</script>

<option {value} {selected}>{valueLabel}</option>
