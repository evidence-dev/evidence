<script>
	import DagDebugNode from './DagDebugNode.svelte';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
	/** @type {import("@evidence-dev/sdk/utils").DagNode} */
	export let dagNode;
</script>

<!--
    Parent (output) -> (input) Child 
-->
{#if query.__dag}
	<DagDebugNode {dagNode} nodeClass="bg-yellow-100" title="Query">
		<svelte:fragment slot="info">
			<dt>Name</dt>
			<dd class="ml-4 font-bold">{dagNode.name.replace('Query |', '')}</dd>
		</svelte:fragment>
	</DagDebugNode>
{/if}
