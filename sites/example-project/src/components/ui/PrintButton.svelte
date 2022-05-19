<script>
    import IoMdPrint from 'svelte-icons/io/IoMdPrint.svelte'
</script>

<span class=print-icon onClick="print()">
    <IoMdPrint/>
</span>

<style>

    .print-icon {
        height: 20px;
        width: 20px;
        color: var(--grey-400);
        cursor: pointer;
        padding-right: 1.5em;
    }

    .print-icon:hover {
        color: var(--grey-500);
    }

</style>
