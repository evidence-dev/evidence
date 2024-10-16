<script>
	import DagDebugNode from './DagDebugNode.svelte';
	/** @type {import("@evidence-dev/sdk/utils").Input} */
	export let input;
</script>

<DagDebugNode dagNode={input.__dag} nodeClass="bg-green-100" title="Input">
	<svelte:fragment slot="info">
		<dt>Has Value</dt>
		<dd class="ml-4 font-bold">{input.hasValue}</dd>
		<dt>Name</dt>
		<dd class="ml-4 font-bold">{input.__dag.name}</dd>
	</svelte:fragment>
</DagDebugNode>
