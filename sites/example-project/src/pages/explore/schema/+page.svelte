<script>
	import { browser } from '$app/environment';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Abc, Calendar, _123, CircleHalf2 } from '@steeze-ui/tabler-icons';
	export let data;
	let { __db: db } = data;

	async function loadMetadata() {
		if (!browser) return {};

		const tables = await db.query(
			`SELECT * FROM information_schema.tables WHERE table_catalog = 'memory' AND table_name != 'stats'`
		);

		const metadatas = await Promise.all(
			tables.map(async (t) => {
				const columns = await db.query(
					`SELECT * FROM information_schema.columns WHERE table_name = '${t.table_name}' AND table_schema = '${t.table_schema}'`
				);
				return [`${t.table_schema}.${t.table_name}`, { table: t, columns }];
			})
		);
		return Object.fromEntries(metadatas);
	}

	let selectedTable = '';
</script>

<h1 class="text-xl">Project Schema</h1>
<p>This page details the tables and columns that are currently loaded in your project.</p>

{#await loadMetadata()}
	Loading Schema Information...
{:then metadata}
	<section>
		<div>
			<h2 class="text-base font-normal font-mono my-2">Tables</h2>
			<ul class="list-none m-0 p-0 flex flex-col gap-2">
				{#each Object.entries(metadata) as [name, meta] (name)}
					<li class="font-mono m-0 text-sm font-bold">
						<button
							class="bg-gray-200 px-2 py-1 rounded"
							class:bg-gray-300={selectedTable === meta}
							on:click={() => {
								selectedTable = selectedTable === meta ? '' : meta;
							}}
						>
							{name}
						</button>
					</li>
					{#if selectedTable === meta}
						<ul 
							class="list-none m-0 flex flex-col gap-2"
						>
							{#each meta.columns as column (column.column_name)}
								<li class="font-mono text-sm bg-gray-100 px-2 py-1 mx-2 rounded flex flex-row" >
									<!-- Icons   -->
									{#if column.data_type === 'INT' || column.data_type === 'BIGINT' || column.data_type === 'SMALLINT' || column.data_type === 'TINYINT' || column.data_type === 'DOUBLE'}
										<Icon src={_123} class="text-gray-600 w-5 h-5" />
									{:else if column.data_type === 'DATE' || column.data_type === 'DATETIME' || column.data_type === 'TIMESTAMP'}
										<Icon src={Calendar} class="text-gray-600 w-5 h-5" />
									{:else if column.data_type === 'BOOLEAN'}
										<Icon src={CircleHalf2} class="text-gray-600 w-5 h-5" />
									{:else}
										<Icon src={Abc} class="text-gray-600 w-5 h-5" />
									{/if}
									<div class="pl-2 lowercase"><b>{column.column_name}</b>&nbsp; {column.data_type}</div>
								</li>
							{/each}
						</ul>
					{/if}
				{/each}
			</ul>
		</div>
	</section>
{:catch e}
	An error was encountered while loading project schema.

	<pre class="px-4 py-2 bg-red-800 text-white">{e.message}</pre>
{/await}