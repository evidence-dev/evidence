<script>
	import SourceConfigFormField from './SourceConfigFormField.svelte';

	export let optionSpec;
	export let options = {};

	for (const [key, spec] of Object.entries(optionSpec)) {
		// Assign defaults
		if (spec.default && !options[key]) options[key] = spec.default;
	}
</script>

{#each Object.entries(optionSpec) as [key, spec]}
	<SourceConfigFormField bind:options {key} {spec} />
{/each}
