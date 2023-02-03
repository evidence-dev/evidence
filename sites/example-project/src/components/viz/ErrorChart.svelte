<script>
    export let error;
    export let chartType;
</script>

<div width=100% class="grid [grid-template-rows:auto] box-content grid-cols-[100%] justify-center bg-red-50 text-grey-700 font-ui font-normal rounded border border-red-100 min-h-[150px] py-5 px-[30px] my-5 print:break-inside-avoid">
    <div class="m-auto w-full">
        <div class="font-bold text-center text-lg">{chartType}</div>
        {#if chartType.includes("Value")}
        <div class="text-center [word-wrap:break-word] text-xs w-[7.8em]">{error}</div>
        {:else}
        <div class="text-center [word-wrap:break-word] text-xs">{error}</div>
        {/if}
    </div>
</div>