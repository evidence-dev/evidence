<script>
	import DagDebugNode from './DagDebugNode.svelte';
	/** @type {import("@evidence-dev/sdk/utils").Input} */
	export let input;

	console.log('>> Creating Input Node <<');
</script>

<DagDebugNode dagNode={input.__dag} nodeClass="bg-green-100" title="Input">
	<svelte:fragment slot="info">
		<dt>Is Set</dt>
		<dd class="ml-4 font-bold">{input.isSet}</dd>
	</svelte:fragment>
</DagDebugNode>
