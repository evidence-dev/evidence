<script>
	import { showQueries } from './stores';
	import { pageHasQueries } from './stores';
	import SQLIcon from '$lib/icons/SQLIcon.svelte';
	import SQLHideIcon from '$lib/icons/SQLHideIcon.svelte';
	function toggleQueries() {
		showQueries.update((value) => !value);
	}
</script>

{#if $pageHasQueries}
	{#if $showQueries}
		<button aria-label="hide-queries" title="Hide Queries" on:click={toggleQueries}>
			<SQLHideIcon height="28" width="28" />
		</button>
	{:else}
		<button aria-label="show-queries" title="Show Queries" on:click={toggleQueries}>
			<SQLIcon height="28" width="28" />
		</button>
	{/if}
{/if}

<style>
	button {
		color: var(--grey-600);
	}

	button:hover {
		color: var(--grey-900);
		transition: all 0.2s;
	}
</style>
