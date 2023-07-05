<script>
	import { browser } from '$app/environment';

	export let data;
	let { __db: db } = data;

	async function loadMetadata() {
		if (!browser) return {};

		const tables = await db.query(
			`SELECT * FROM information_schema.tables WHERE table_catalog = 'memory'`
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
</script>

<h1 class="text-xl">Project Schema</h1>
<p>This page details the tables and columns that are currently loaded in your project.</p>
{#await loadMetadata()}
	Loading Metadata...
{:then metadata}
	{#each Object.entries(metadata) as [name, meta] (name)}
		<section class="my-2">
			<header class="font-bold text-xl">
				Table <span class="font-mono text-base">{name}</span>
			</header>
			<dl class="px-4 text-sm">
				{#each meta.columns as col}
					<dt class="font-semibold">{col.column_name}</dt>
					<dd class="px-2">
						<dl class="px-4">
							<dt class="font-semibold">Data Type</dt>
							<dd class="px-2">{col.data_type}</dd>
							<dt class="font-semibold">Nullable</dt>
							<dd class="px-2">{col.is_nullable}</dd>
						</dl>
					</dd>
				{/each}
			</dl>
		</section>
		<hr class="border-gray-400 w-5/6" />
	{/each}
{:catch e}
	An error was encountered while loading project schema.

	<pre class="px-4 py-2 bg-red-800 text-white">{e.message}</pre>
{/await}
