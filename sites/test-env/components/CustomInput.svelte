<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';

	const inputs = getInputContext();

	export let name;
	export let lower = 250;
	export let upper = 750;
	export let selected = 500;

	$: $inputs[name] = {
		lower,
		upper,
		selected
	};
</script>

<input type="range" bind:value={lower} min={0} max={upper} />
<input type="range" bind:value={selected} min={lower} max={upper} />
<input type="range" bind:value={upper} min={lower} max={1000} />
