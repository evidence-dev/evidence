<script>
	import DataTable from '../../../unsorted/viz/table/DataTable.svelte';
	import { ContentBox } from '../../../atoms/content-box/index.js';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox togglable defaultOpen={false}>
	<span slot="header">Data Preview</span>
	<div class="w-full overflow-x-auto">
		{#if query.dataLoaded}
			<DataTable data={query} rowNumbers sortable={false} downloadable={false} isFullPage />
		{:else}
			<button
				class="px-2 py-1 rounded-sm bg-primary text-primary-content hover:brightness-110 transition"
				on:click={() => query.fetch()}
			>
				Fetch Data
			</button>
		{/if}
	</div>
</ContentBox>
