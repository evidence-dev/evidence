<script>
	import { browser } from '$app/environment';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Table, Database } from '@steeze-ui/tabler-icons';
	import TableView from '../../atoms/table-view/TableView.svelte';
	export let data;
	let { __db: db } = data;

	async function loadMetadata() {
		if (!browser) return {};

		const tables = await db.query(
			`SELECT * FROM information_schema.tables WHERE table_catalog = 'memory' AND table_name != 'stats'`
		);

		const metadatas = {};

		await Promise.all(
			tables.map(async (t) => {
				const columns = await db.query(
					`SELECT * FROM information_schema.columns WHERE table_name = '${t.table_name}' AND table_schema = '${t.table_schema}'`
				);

				if (!metadatas[t.table_schema]) {
					metadatas[t.table_schema] = {};
				}

				metadatas[t.table_schema][t.table_name] = { table: t, columns };
			})
		);

		return metadatas;
	}

	let selectedTable = '';
	let selectedSource = '';
</script>

{#await loadMetadata()}
	Loading Schema Information...
{:then metadata}
	<section>
		<div>
			<ul class="list-none m-0 p-0 flex flex-col gap-1 mb-1">
				{#each Object.entries(metadata) as [source, meta] (source)}
					<li class="font-mono m-0 text-sm text-white">
						<button
							class="bg-gray-500 px-2 py-1 rounded font-bold flex w-full hover:bg-blue-500"
							class:bg-blue-500={selectedSource === source}
							on:click={() => {
								selectedSource = selectedSource === source ? '' : source;
								selectedTable = ''; // Reset selectedTable when source is clicked
							}}
						>
							<Icon src={Database} class="text-white w-5 h-5 mr-1" />
							{source}
						</button>
					</li>
					{#if selectedSource === source}
						<ul class="list-none m-0 flex flex-col gap-1">
							{#each Object.entries(meta) as [name, tableMeta] (name)}
								<li class="font-mono m-0 text-sm font-bold ml-3">
									<button
										class="bg-gray-200 px-2 py-1 rounded flex w-full hover:bg-blue-200"
										class:bg-blue-200={selectedTable === tableMeta}
										on:click={() => {
											selectedTable = selectedTable === tableMeta ? '' : tableMeta;
										}}
									>
										<Icon src={Table} class="text-gray-700 w-5 h-5 mr-1" />
										{name}
									</button>
								</li>
								{#if selectedTable === tableMeta}
									<TableView columns={tableMeta.columns} rowClass="ml-6 " />
								{/if}
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
