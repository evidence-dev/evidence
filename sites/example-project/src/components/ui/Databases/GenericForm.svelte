<script>
    export let opts
    export let credentials
</script>


<hr/>

{#each opts as opt}

    {#if opt.type === "text"}
    <div class=input-item>
        <label for={opt.id}>{opt.label}</label>
        <input
            type=text
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
        />
    </div>
    {:else if opt.type === "password"}
    <div class=input-item>
        <label for={opt.id}>{opt.label}</label>
        <input
            type=password
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
        />
    </div>
    {:else}
    <div>Error</div>
    {/if}

{/each}

<style>
    hr {
        width: 100%
    }

    div.input-item{
        font-family: var(--ui-font-family);
        color: var(--grey-999);
        font-size: 16px;
        margin-top: 1.25em;
        display:flex;
        flex-direction: row;
    }

    input {
        box-sizing: border-box;
        border-radius: 4px 4px 4px 4px;
        border: 1px solid #c0c0c0;
        padding: 0.25em 0.25em 0.25em 0.25em;
        margin-left: auto;
        margin-right: 2em;
        width: 70%;
        padding: 0.35em;
        color: var(--grey-999);
        -webkit-appearance: none;
        -moz-appearance: none;
        vertical-align:middle;

    }
    input:required {
       box-shadow: none;
    }
    input:focus{
        outline: none;
    }

    label {
        width: 15%
    }

</style>
