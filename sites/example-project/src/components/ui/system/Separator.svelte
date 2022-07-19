<script>
    export let contents
</script>

<div class="separator"><slot></slot></div>

<style>
    .separator {
        display: flex;
        align-items: center;
        text-align: center;
        margin-block-start: 2.5em;
        color: var(--grey-600);
        font-weight:bold;
    }

    .separator::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--grey-200);
    }

    .separator:not(:empty)::after {
        margin-left: 1.5em;
        margin-top: 0.1em;
    }
</style>