<script>
	import { browser } from '$app/environment';

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
					`SELECT * FROM information_schema.columns WHERE table_name = '${t.table_name}'`
				);
				return [t.table_name, { table: t, columns }];
			})
		);
		return Object.fromEntries(metadatas);
	}

	let selectedTable = "";
</script>

<h1 class="text-xl">Project Schema</h1>
<p>This page details the tables and columns that are currently loaded in your project.</p>

{#await loadMetadata()}
	Loading Schema Information...
{:then metadata}
<section>
	<div>
		<h2 class="text-base font-normal font-mono mt-0"> Tables </h2>
		<ul class="list-none m-0 p-0 flex flex-col gap-1">
		{#each Object.entries(metadata) as [name, meta] (name)}
			<li class="font-mono m-0 text-sm">
				<button class="bg-gray-100 px-2 py-1" 
				class:bg-gray-200={selectedTable === meta}
				on:click={() => selectedTable = meta}
				>
					{name}
				</button>
			</li>
		{/each}
		</ul>
	</div>
	<div>
		<h2 class="text-base font-normal font-mono mt-0"> Columns </h2>
		<ul class="text-sm flex flex-wrap gap-2">
		{#each selectedTable.columns ?? [] as col}
		<dl class="p-2">
			<dt class="font-semibold">{col.column_name}</dt>
			<dd class="px-2">
				<dl class="px-4">
					<dt class="font-semibold">Data Type</dt>
					<dd class="px-2">{col.data_type}</dd>
					<dt class="font-semibold">Nullable</dt>
					<dd class="px-2">{col.is_nullable}</dd>
				</dl>
			</dd>
		</dl>
		{/each}
		</ul>
	</div>
</section>

{:catch e}
	An error was encountered while loading project schema.

	<pre class="px-4 py-2 bg-red-800 text-white">{e.message}</pre>
{/await}

<style lang="postcss">
	section {
		@apply grid gap-8;

		grid-template-columns: auto 1fr;
	}
</style>