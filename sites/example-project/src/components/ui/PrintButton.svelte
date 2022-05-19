<script>
    import IoMdPrint from 'svelte-icons/io/IoMdPrint.svelte'
    // import FaRegFilePdf from 'svelte-icons/fa/FaRegFilePdf.svelte'
    // import FaFilePdf from 'svelte-icons/fa/FaFilePdf.svelte'
    // import GoFilePdf from 'svelte-icons/go/GoFilePdf.svelte'
</script>

<span class=print-icon onClick="print()">
    <IoMdPrint/>
</span>

<!-- <span class=print-icon onClick="print()">
    <GoFilePdf/>
</span>

<span class=print-icon onClick="print()">
    <FaFilePdf/>
</span>

<span class=print-icon onClick="print()">
    <FaRegFilePdf/>
</span> -->

<style>

    .print-icon {
        height: 20px;
        width: 20px;
        color: var(--grey-400);
        cursor: pointer;
        margin-right: 15px;
    }

    .print-icon:hover {
        color: var(--grey-500);
    }

</style>
