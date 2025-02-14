<script>
	import { SchemaExplorer } from '@evidence-dev/core-components';
	export let data;

	const createSourceTable = async (sourceName, tableName) => {
		await fetch('create/table', {
			method: 'POST',
			data: {
				source: sourceName,
				table: tableName
			}
		});
	};
</script>

<h1 class="markdown">Project Schema</h1>
<p class="markdown">
	This page details the tables and columns that are currently loaded in your project.
</p>

<h2 class="markdown">Sources</h2>

<SchemaExplorer {data} {createSourceTable} />
