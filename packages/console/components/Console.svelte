<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { query, setData } from './duckdb';
    import { DataTable } from "@evidence-dev/core-components";

	/** @type{Record<string, unknown[]>} */
	export let data;

	let sql_query = `
        select * from data limit 10
    `.trim();

	let limit = 50;
	let pagination = 0;

	$: setData('data', data);

	$: paginated_query = `
	    WITH query as (${sql_query.replace(/;$/, '')})
        SELECT
            row_number() over() as row,
            * 
        FROM query GROUP BY all
	    LIMIT ${limit}
	    OFFSET ${pagination * limit};
	`;

	$: paginated_results = query(paginated_query);

    /**
     * @param {import('apache-arrow').Table} table
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

{#await paginated_results}
    Loading...
{:then results}
    <DataTable data={arrowTableToJSON(results)} />
{:catch error}
    {error.message}
{/await}

<article class="prose prose-invert sm:prose-sm mx-auto my-10 px-10 bg-black">
	<div class="h-72 my-3">
		{#await paginated_results}
			Loading...
		{:then results}
			<div class="overflow-x-auto px-1" in:blur|local>
				<table class="table-auto font-mono text-xs">
					<thead>
						<tr>
							{#each results.schema.fields as column}
								<th>{column.name}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each Array(results.numRows) as _, row_number}
							{@const row = (_, results.get(row_number))}
							<tr>
								{#each results.schema.fields as column}
									<td>{row[column.name]}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:catch error}
			{error.message}
		{/await}
	</div>
</article>
