<script>
    import { ExportToCsv } from 'export-to-csv';

    export let data;
    export let queryID;
    export let text = 'Download';

    export let downloadData = (data) => {
        const options = { 
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: false,
            filename: queryID ?? "evidence_download",
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
        };
 
        const csvExporter = new ExportToCsv(options);
      
        csvExporter.generateCsv(data);     
    }

</script>

<button type="button" class={$$props.class} on:click={downloadData(data)}>
    <span>{text}</span>
    <slot>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
    </slot>
  </button>

<style>
    button :global(svg) {
        stroke: var(--grey-400);
        margin-top: auto;
        margin-bottom: auto;
    }

    button {
        display: grid;
        grid-row: auto;
        grid-template-columns: auto auto;
        gap: 3px;
        float: right;
        /* margin-left: 5px; */
        cursor: pointer;
        font-family: sans-serif;
        font-size: 0.7rem;
        color: var(--grey-400);
        vertical-align: text-top;
        justify-items: center;
        position:relative;
        background-color: transparent;
        border: none;
    }

    button:hover {
        color: var(--grey-500);
    }

    button:hover :global(svg) {
        stroke: var(--grey-500);
    }
    
    @media (max-width: 600px) {
        button {
            display: none;
        }
    }
    
    @media print {
        button {
            display: none;
        }
    }
</style>

