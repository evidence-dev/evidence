<script>
    export let opts
    export let credentials
</script>


<hr/>

{#each opts as opt}
<div class=input-item>
    <label for={opt.id}>

        {#if opt.additionalInstructions}
        <span class="additional-info" >
            {opt.label}
            <span class="additional-info-msg">{opt.additionalInstructions}</span>
        </span>
        {:else}
        {opt.label}
        {/if}
    </label>

    {#if opt.type === "text"}
        {#if opt.optional}
        <input
            type=text
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
        />
        {:else }
        <input
            type=text
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
            required
        />
        {/if}
    {:else if opt.type === "password"}
        {#if opt.optional}
        <input
            type=password
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
        />
        {:else }
        <input
            type=password
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
            required
            />
        {/if}
    {/if}
</div>

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
        border: 1px solid var(--grey-300);
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
        width: 25%
    }

    .additional-info {
        display: inline;
        position: relative;
        cursor: help;
    }

    .additional-info .additional-info-msg {
        visibility: hidden;
        position: absolute;
        top: -5px;
        left: 105%;
        white-space: nowrap;
        padding-left: 5px;
        padding-right: 5px;     
        padding-top: 2px;
        padding-bottom: 1px;   
        color: white;
        font-family: sans-serif;
        font-size: 0.8em;
        background-color: var(--grey-900);
        opacity: 0.85;
        border-radius: 6px;
        z-index: 1;
    }

    .additional-info:hover .additional-info-msg {
        visibility: visible;
    }


</style>
