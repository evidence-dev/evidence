<script>
	import TiArrowSortedUp from 'svelte-icons/ti/TiArrowSortedUp.svelte';
	import TiArrowSortedDown from 'svelte-icons/ti/TiArrowSortedDown.svelte';

	export let ascending;
</script>

<span class="icon-container">
	<span class="sort-icon">
		{#if ascending}
			<TiArrowSortedUp />
		{:else}
			<TiArrowSortedDown />
		{/if}
	</span>
</span>

<style>
	.sort-icon {
		width: 12px;
		height: 12px;
		align-items: center;
	}

	.icon-container {
		display: inline-flex;
		align-items: center;
		vertical-align: bottom;
		margin-bottom: 0.6em;
		margin-left: 0.2em;
	}
</style>
