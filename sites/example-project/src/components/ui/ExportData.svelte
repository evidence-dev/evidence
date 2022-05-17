<script>
    import {blur, slide} from 'svelte/transition';
    import { ExportToCsv } from 'export-to-csv';

    export let data;
    export let queryID;


    function exportData(data) {
        const options = { 
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: false,
            filename: queryID,
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
        };
 
        const csvExporter = new ExportToCsv(options);
      
        csvExporter.generateCsv(data);
    }

</script>

<!-- <span class=export-icon transition:slide|local on:click={exportData(data)}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
</span> -->

<!-- <span class=export-icon transition:slide|local on:click={exportData(data)}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
    <span class=tooltip>Download to CSV</span>
</span> -->

<!-- <div class=export-icon transition:slide|local on:click={exportData(data)}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
    <span>Download Data</span>
</div> -->

<!-- <div class=export-icon transition:slide|local on:click={exportData(data)}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
    <span>Download to CSV</span>
</div> -->

<div class=export-icon transition:slide|local on:click={exportData(data)}>
    <span>Download to CSV</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
</div>

<!-- <span class=export-data transition:slide|local on:click={exportData(data)}>&darr; Download Data</span> -->


<style>
    svg {
        stroke: var(--grey-400);
    }

    .export-icon {
        display: grid;
        grid-row: auto;
        grid-template-columns: auto auto;
        gap: 3px;
        float: right;
        /* margin-left: 5px; */
        margin-top: 3px;
        margin-right: 7px;
        cursor: pointer;
        font-family: sans-serif;
        font-size: 0.75em;
        color: var(--grey-400);
        vertical-align: text-top;
        justify-items: center;
        position:relative;

    }

    .export-icon:hover {
        color: var(--grey-500);
    }

    .export-icon:hover svg {
        stroke: var(--grey-500);
    }

    .export-data {
        color: var(--blue-500);
        font-family: sans-serif;
        font-size: 0.8em;
        float: right;
        cursor: pointer;
        margin-right: 8px;
    }

    .export-data:hover {
        color: var(--blue-600);
    }

    .tooltip {
        display: none;
        position: absolute;
        top: -5px;
        left: 105%;
        padding-left: 5px;
        padding-right: 5px;     
        padding-top: 2px;
        padding-bottom: 1px;   
        color: white;
        font-family: sans-serif;
        font-size: 1em;
        background-color: var(--grey-900);
        opacity: 0.85;
        border-radius: 6px;
        z-index: 1;
        white-space: nowrap;
    }

    .export-icon:hover .tooltip {
        display: inline;
    }
</style>

