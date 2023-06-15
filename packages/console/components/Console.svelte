<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { browser } from '$app/environment';
	import { query, setData } from './duckdb';
	import DataTable from './DataTable.svelte';

	/** @type {Record<string, unknown[]>} */
	export let data;

	let sql_query = `
        select * from data limit 100
    `.trim();

	let limit = 10;
	let pagination = 1;

	$: setData('data', data);

	$: total_rows = query(`
        SELECT COUNT(*) FROM (${sql_query.replace(/;$/, '')})
    `);

	$: paginated_results = query(`
	    WITH query as (${sql_query.replace(/;$/, '')})
        SELECT * FROM query
	    LIMIT ${limit}
	    OFFSET ${(pagination - 1) * limit};
	`);

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

		for (let i = 0; i < table.numRows; i++) {
			const row = {};
			const table_row = table.get(i);
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
	<DataTable data={results} {totalRows} bind:currentPage={pagination} />
{/if}
