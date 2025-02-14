<script>
	import { browser } from '$app/environment';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Plus, Table, Database } from '@steeze-ui/tabler-icons';
	import TableView from '../../atoms/table-view/TableView.svelte';
	export let data;

	/** @type {(source: string, table: string) => Promise<string>} */
	export let createSourceTable;

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
					<li class="font-mono m-0 text-sm">
						<button
							class="cursor-pointer bg-base-200 px-2 py-1 rounded-sm font-bold flex w-full hover:bg-base-300 hover:text-base-content"
							class:bg-info={selectedSource === source}
							class:text-info-content={selectedSource === source}
							on:click={() => {
								selectedSource = selectedSource === source ? '' : source;
								selectedTable = ''; // Reset selectedTable when source is clicked
							}}
						>
							<Icon src={Database} class="w-5 h-5 mr-1" />
							{source}
						</button>
					</li>
					{#if selectedSource === source}
						<ul class="list-none m-0 flex flex-col gap-1">
							{#each Object.entries(meta) as [name, tableMeta] (name)}
								<li class="font-mono m-0 text-sm font-bold ml-3">
									<button
										class="cursor-pointer bg-base-200 px-2 py-1 rounded-sm flex w-full hover:bg-base-300 hover:text-base-content"
										class:bg-info={selectedTable === tableMeta}
										class:text-info-content={selectedTable === tableMeta}
										on:click={() => {
											selectedTable = selectedTable === tableMeta ? '' : tableMeta;
										}}
									>
										<Icon src={Table} class="w-5 h-5 mr-1" />
										{name}
									</button>
								</li>
								{#if selectedTable === tableMeta}
									<TableView columns={tableMeta.columns} rowClass="ml-6 " />
								{/if}
							{/each}
							{#if createSourceTable}
								<li class="font-mono m-0 text-sm font-bold ml-3">
									<button
										class="cursor-pointer bg-base-200 text-info px-2 py-1 rounded-sm flex w-full hover:bg-base-300"
										on:click={() => {
											// We want to open the file in vscode automatically without another window or similar
											const aHref = document.createElement('a');
											aHref.setAttribute(
												'href',
												`vscode://file//Users/brian/code/evidence/evidence/sites/test-env/sources/pokemon/pokedex.js`
											);
											aHref.style.display = 'none';
											document.body.appendChild(aHref);
											aHref.click();
											document.body.removeChild(aHref);
										}}
									>
										<Icon src={Plus} class="w-5 h-5 mr-1" />
										Create new table
									</button>
								</li>
							{/if}
						</ul>
					{/if}
				{/each}
			</ul>
		</div>
	</section>
{:catch e}
	An error was encountered while loading project schema.

	<pre class="px-4 py-2 bg-negative">{e.message}</pre>
{/await}
