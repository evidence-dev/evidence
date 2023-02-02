<script>
    export let error;
    export let chartType;
</script>

<div width=100% class="error grid [grid-template-rows:auto] grid-cols-[100%] justify-center bg-red-50 text-grey-700 font-ui font-normal rounded border border-red-100 min-h-[150px] py-5 px-[30px] my-5 print:break-inside-avoid">
    <div class="m-auto w-full">
        <div class="font-bold text-center text-[1.2rem]">{chartType}</div>
        {#if chartType.includes("Value")}
        <div class="value-message text-center [word-wrap:break-word] text-[0.8rem] w-[7.8em]">{error}</div>
        {:else}
        <div class="text-center [word-wrap:break-word] text-[0.8rem]">{error}</div>
        {/if}
    </div>
</div>