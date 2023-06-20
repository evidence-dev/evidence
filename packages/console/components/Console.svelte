<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { browser } from '$app/environment';
	import { query, setData } from './duckdb';
	import DataTable from './DataTable.svelte';
	import debounce from 'debounce';

	/** @type {Record<string, unknown[]>} */
	export let data;
	$: setData('data', data);

	export let sql_query = 'select * from data limit 100';

	const limit = 10;
	let currentPage = 1;

	const debounce_delay = 200;

	let total_rows = Promise.resolve(0);
	const updateTotalRows = debounce(
		() => (total_rows = query(`SELECT COUNT(*) FROM (${sql_query.replace(/;$/, '')})`)),
		debounce_delay
	);
	$: sql_query, updateTotalRows();

	/** @type {Promise<null | Awaited<ReturnType<typeof query>>} */
	let paginated_results = Promise.resolve(null);
	const updateResults = () =>
		(paginated_results = query(`
            WITH query as (${sql_query.replace(/;$/, '')})
            SELECT * FROM query
            LIMIT ${limit}
            OFFSET ${(currentPage - 1) * limit};
    `));
	const debouncedUpdateResults = debounce(updateResults, debounce_delay);
	$: sql_query, debouncedUpdateResults(); // for user input
	$: currentPage, updateResults(); // for page change

	/** @type {Awaited<typeof paginated_results>} */
	let results = null;
	let totalRows = 0;
	$: Promise.all([paginated_results, total_rows]).then(([_results, total_rows_table]) => {
		if (!browser) return;
		totalRows = Number(total_rows_table.get(0)['count_star()']);
		results = arrowTableToJSON(_results);
	});

	/**
	 * @param {Awaited<ReturnType<typeof query>>} table
	 * @returns {Record<string, unknown>[]}
	 */
	function arrowTableToJSON(table) {
		const rows = [];

		for (const table_row of table) {
			const row = {};
			for (const column of table.schema.fields) {
				row[column.name] = table_row[column.name];
				if (typeof row[column.name] === 'bigint') {
					row[column.name] = Number(row[column.name]);
				}
			}
			rows.push(row);
		}

		return rows;
	}
</script>

<div class="container mx-auto pt-16">
	<div class="font-mono bg-black p-5 rounded-xl text-sm text-white">
		<textarea
			class="pb-1 min-h-[100px] outline-none focus:outline-0 resize-none w-full bg-black text-white font-mono text-sm"
			bind:value={sql_query}
		/>
	</div>
</div>

{#if results}
	<DataTable data={results} {totalRows} bind:currentPage />
{/if}
