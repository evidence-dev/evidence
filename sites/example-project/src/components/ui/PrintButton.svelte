<script>
    import FaRegFilePdf from 'svelte-icons/fa/FaRegFilePdf.svelte'
</script>

<span class=print-icon onClick="print()" title="Print to PDF">
    <FaRegFilePdf/>
</span>

<style>

    .print-icon {
        height: 22px;
        width: 22px;
        color: var(--grey-400);
        cursor: pointer;
        padding-right: 1.5em;
        position: relative;
    }

    .print-icon:hover {
        color: var(--grey-500);
    }

    @media (max-width: 850px) {
        .print-icon {
            display: none;
        }
    }

</style>
