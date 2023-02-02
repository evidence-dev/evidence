<script>
    import { dev } from '$app/environment';
    export let error;
    export let chartType;

    const MissingCredentialsError = "SQL Error: Missing database credentials"
</script>

<div class="grid [grid-template-rows:auto] grid-cols-[100%] justify-center bg-red-50 text-grey-700 font-ui font-normal rounded border border-red-100 min-h-[150px] box-content py-5 px-[30px] my-5 print:break-inside-avoid">
    <div class="m-auto w-full">
        <div class="font-bold text-center text-[1.2rem]">{chartType}</div>
        <div class="text-center [word-wrap:break-work] text-[0.8rem]" class:w-[7.8em]={chartType.includes("Value")}>{error}</div>
        {#if dev && error === MissingCredentialsError}
            <a class=credentials-link href='/settings'> Add credentials &rarr;</a>
        {/if}
    </div>
</div>