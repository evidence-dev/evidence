<script>
    import { formatValue as fmt } from '$lib/modules/formatting.js';
    import formatTitle from '$lib/modules/formatTitle';
    import getColumnSummary from '$lib/modules/getColumnSummary';
    import checkInputs from '$lib/modules/checkInputs';
    import { convertColumnToDate } from '$lib/modules/dateParsing';

    import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { propKey, strictBuild } from './context';

    export let data;
    export let description = false;
    export let delta = false;
    export let pctChange = false;
    export let row = 0;
    export let comparisonRow = 1;
    export let showFirstColumn = false;

    export let error = undefined;

    // Set up props store
	let props = writable({});
	setContext(propKey, props);

    // ---------------------------------------------------------------------------------------
	// DATA SETUP
	// ---------------------------------------------------------------------------------------

	let columnSummary;

$: try {
    error = undefined;
    // CHECK INPUTS
    checkInputs(data);

    // GET COLUMN SUMMARY
    columnSummary = getColumnSummary(data, 'array');

    // PROCESS DATES
    // Filter for columns with type of "date"
    let dateCols = columnSummary.filter((d) => d.type === 'date');
    dateCols = dateCols.map((d) => d.id);

    if (dateCols.length > 0) {
        for (let i = 0; i < dateCols.length; i++) {
            data = convertColumnToDate(data, dateCols[i]);
        }
    }

} catch (e) {
    error = e.message;
    if (strictBuild) {
        throw error;
    }
}

    // ---------------------------------------------------------------------------------------
	// Add props to store to let child components access them
	// ---------------------------------------------------------------------------------------
	props.update((d) => {
		return { ...d, data, columns: [] , delta};
	});


</script>

<slot/>
<table>
    <thead>
        <tr>
            <th></th>
            {#if $props.columns[0]?.description || description}<th>Description</th>{/if}
            <th>Value</th>
            {#if delta}<th>Abs. Change</th>{/if}
            {#if pctChange}<th>% Change</th>{/if}
        </tr>
    </thead>
    
    <tbody>
        {#if $props.columns.length > 0}
            {#each $props.columns as column, i}
                    <tr>
                        <td><b>{#if column.title}{column.title}{:else}{formatTitle(column.id)}{/if}</b></td>
                        {#if $props.columns[0]?.description || description}<td>{$props.columns[i]?.description ? $props.columns[i].description : " "}</td>{/if}
                        <td>{fmt(data[row][column.id], column.format)}</td>
                        {#if delta}<td>{fmt(data[row][column.id] - data[comparisonRow][column.id], column.format)}</td>{/if}
                        {#if pctChange}<td>{fmt((data[row][column.id] - data[comparisonRow][column.id]) / data[comparisonRow][column.id],'+0.0%;-0.0%;-')}</td>{/if}
                    </tr>
            {/each}
        {:else}
            {#each Object.entries(data[row]) as [key, value], i}
                {#if (showFirstColumn && i === 0) || i > 0}
                    <tr>
                        <td><b>{formatTitle(key)}</b></td>
                        <td>{fmt(value)}</td>
                        {#if delta}<td>{fmt(value - data[comparisonRow][key])}</td>{/if}
                        {#if pctChange}<td>{fmt((value - data[comparisonRow][key]) / data[comparisonRow][key],'+0.0%;-0.0%;-')}</td>{/if}
                        
                    </tr>
                {/if}
            {/each}
        {/if}
    </tbody>
</table>

<style>
    td {
        font-variant-numeric: tabular-nums;
        max-width: unset;
    }

</style>