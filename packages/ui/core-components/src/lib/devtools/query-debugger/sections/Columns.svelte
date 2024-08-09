<script>
	import { ContentBox } from '../../content-box/index.js';
	import { TableView } from '../../table-view/index.js';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox togglable defaultOpen={false}>
	<span slot="header">Columns</span>
	<div class="w-fit grid grid-cols-2 gap-2">
		<TableView
			class="contents"
			rowClass="bg-inherit hover:bg-inherit"
			columns={query.columns}
			data={query.data}
			{query}
		/>
	</div>
</ContentBox>
