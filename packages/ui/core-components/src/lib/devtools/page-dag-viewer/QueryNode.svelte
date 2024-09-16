<script>
	import DagDebugNode from './DagDebugNode.svelte';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<!--
    Parent (output) -> (input) Child 
-->
{#if query.__dag}
	<DagDebugNode dagNode={$query.__dag} nodeClass="bg-blue-100" title="Query">
		<svelte:fragment slot="info">
			<dt>Name</dt>
			<dd class="ml-4 font-bold">{$query.id}</dd>
		</svelte:fragment>
	</DagDebugNode>
{/if}
