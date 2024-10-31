<script>
	import Diff from './Diff.svelte';
	/** @type {import ("@evidence-dev/sdk/utils").History}*/
	export let history;
</script>

{#each history.reverse() as input}
	<div class="my-4">
		<Diff diffData={input} />
	</div>
{:else}
	<div class="my-4">No History Available</div>
{/each}
