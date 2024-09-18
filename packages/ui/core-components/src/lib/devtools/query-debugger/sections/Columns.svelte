<script>
	import { ContentBox } from '../../../atoms/content-box/index.js';
	import { TableView } from '../../../atoms/table-view/index.js';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox togglable defaultOpen={false}>
	<span slot="header">Columns</span>
	{#if query.columns?.length}
		<div class="w-fit grid grid-cols-2 gap-2">
			<TableView
				class="contents"
				rowClass="bg-inherit hover:bg-inherit"
				columns={query.columns}
				{query}
			/>
		</div>
	{:else}
		Columns not available
	{/if}
</ContentBox>
