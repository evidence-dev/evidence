<script>
	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import VariableCopy from './VariableCopy.svelte';

	/** @type {DatasourceSpec[]} */
	export let sources;
</script>

<div class="flex justify-between mb-2 font-medium text-sm text-base-content">
	<span class="font-sm">Key</span>
	<span class="font-sm">Value</span>
</div>
<div class="grid grid-cols-2 gap-x-6 gap-y-4">
	{#each sources as datasource}
		{#each Object.entries(datasource?.environmentVariables) as [key, value]}
			<VariableCopy text={key} />
			<VariableCopy text={value} hideText={true} />
		{/each}
	{/each}
</div>
