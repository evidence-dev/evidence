<script>
	import SourceConfigFormField from './SourceConfigFormField.svelte';

	export let optionSpec;
	export let options = {};
	export let disabled = false;
	export let rootOptions = options;
	export let reveal;

	for (const [key, spec] of Object.entries(optionSpec)) {
		// Assign defaults
		if (spec.default && !options[key]) {
			options[key] = spec.default;
		}
	}
</script>

{#each Object.entries(optionSpec) as [key, spec]}
	<SourceConfigFormField {reveal} {disabled} bind:options {key} {spec} {rootOptions} />
{/each}
