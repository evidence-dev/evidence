<script>
    export let error;
    export let chartType;
</script>

<div width=100% class="error">
    <div class="wrapper">
        <div class="chart-type">{chartType}</div>
        {#if chartType.includes("Value")}
        <div class="value-message">{error}</div>
        {:else}
        <div class="message">{error}</div>
        {/if}
    </div>
</div>

<style>
    .error {
        background-color: var(--red-50);
        font-family: var(--ui-font-family);
        color: var(--grey-700);
        font-weight: normal;
        border-radius: 4px;
        border: 1px solid var(--red-100);
        min-height: 150px;
        padding: 20px 30px 20px 30px;
        margin-top: 20px;
        margin-bottom: 20px;
        display: grid;
        grid-template-rows: auto;
        grid-template-columns: 100%;
        justify-content: center;
    }

    .wrapper {
        margin: auto;
        width: 100%;
    }

    .chart-type {
        font-weight: bold;
        text-align: center;
        font-size: 1.2rem;
    }

    .message {
        text-align: center;
        word-wrap: break-word;
        font-size: 0.8rem;
    }

    .value-message {
        text-align: center;
        word-wrap: break-word;
        font-size: 0.8rem;
        width: 7.8em;
    }

    @media print {
    .error {
        break-inside: avoid;
    }
  }
</style>