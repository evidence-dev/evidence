<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { browser } from '$app/environment';
	import { query, setData } from './duckdb';
	import DataTable from './DataTable.svelte';
	import { ErrorChart } from '@evidence-dev/core-components';
	import debounce from 'debounce';
	import { makeTable } from 'apache-arrow';

	const instance = Symbol();

	/** @type {Record<string, unknown[]>} */
	export let data;
	$: loaded = setData(instance, 'data', data);

	export let sql_query = 'select * from data limit 100';

	const limit = 10;
	let currentPage = 1;

	const debounce_delay = 200;

	/** @type {Promise<import("apache-arrow").Table>} */
	let total_rows = Promise.resolve(makeTable({ total_rows: new Int8Array([0]) }));
	const updateTotalRows = debounce(
		() =>
			(total_rows = query(
				instance,
				`SELECT COUNT(*) as total_rows FROM (${sql_query.replace(/;$/, '')})`
			)),
		debounce_delay
	);
	$: sql_query, updateTotalRows();

	/** @type {Promise<null | import("apache-arrow").Table>} */
	let paginated_results = Promise.resolve(null);
	const updateResults = () =>
		(paginated_results = query(
			instance,
			`
            WITH query as (${sql_query.replace(/;$/, '')})
            SELECT * FROM query
            LIMIT ${limit}
            OFFSET ${(currentPage - 1) * limit};
    `
		));
	const debouncedUpdateResults = debounce(updateResults, debounce_delay);
	$: sql_query, debouncedUpdateResults(); // for user input
	$: currentPage, updateResults(); // for page change

	/** @type {Record<string, any>[] | null} */
	let results = null;
	let totalRows = 0;
	/** @type {Error | undefined} */
	let error;
	$: Promise.all([paginated_results, total_rows])
		.then(([_results, total_rows_table]) => {
			if (!browser) return;
			totalRows = Number(total_rows_table.get(0)?.total_rows);
			results = arrowTableToJSON(_results);
			error = undefined;
		})
		.catch((e) => {
			if (e.message.startsWith('Parser Error')) return;
			error = e.message;
		});

	/**
	 * @param {import("apache-arrow").Table} table
	 * @returns {Record<string, unknown>[]}
	 */
	function arrowTableToJSON(table) {
		const rows = [];

		for (const table_row of table) {
			/** @type {Record<string, any>} */
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

{#await loaded}
	<div
		class="grid grid-rows-auto box-content grid-cols-1 justify-center bg-grey-100 text-grey-700 font-ui font-normal rounded border border-red-100 min-h-[150px] py-5 px-8 my-5 print:break-inside-avoid"
	>
		<div class="m-auto w-full">
			<div class="font-bold text-center text-lg">Loading...</div>
		</div>
	</div>
{:then}
	{#if error}
		<ErrorChart {error} chartType="Data Table" />
	{:else if results}
		<DataTable data={results} {totalRows} bind:currentPage />
	{/if}
{/await}
