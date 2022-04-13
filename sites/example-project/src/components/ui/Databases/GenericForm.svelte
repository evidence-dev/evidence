<script>
    import IoIosHelpCircleOutline from 'svelte-icons/io/IoIosHelpCircleOutline.svelte'

    export let opts
    export let credentials
    export let disableSave

    let requiredOpts = opts.filter(d => d.optional !== true);

    function handleChange() {
        let filledFields = 0;
        let fieldStatus = false;

        for(let i=0; i<requiredOpts.length; i++){
            fieldStatus = credentials[requiredOpts[i].id] != undefined && credentials[requiredOpts[i].id] !== '';
            filledFields = filledFields + fieldStatus;
        }

        if(filledFields === requiredOpts.length){
            disableSave = false;
        } else {
            disableSave = true;
        }

    }

</script>

{#each opts as opt}
<div class=input-item>
    <label for={opt.id}>
        {opt.label}

        {#if opt.additionalInstructions}
        <span class="additional-info-icon">
                <IoIosHelpCircleOutline/>
                <span class=info-msg>{opt.additionalInstructions}</span>
        </span>
        {/if}
    </label>


    {#if opt.type === "text"}
        {#if opt.optional}
        <input
            type=text
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
            placeholder={opt.placeholder}
        />
        {:else }
        <input
            type=text
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
            placeholder={opt.placeholder}
            required
            on:keyup={handleChange}
        />
        {/if}
    {:else if opt.type === "password"}
        {#if opt.optional}
        <input
            type=password
            id={opt.id}
            name={opt.id}
            placeholder="password"
            bind:value={credentials[opt.id]}
        />
        {:else }
        <input
            type=password
            id={opt.id}
            name={opt.id}
            placeholder="password"
            bind:value={credentials[opt.id]}
            required
            on:keyup={handleChange}
            />
        {/if}
    {/if}
</div>

{/each}

<style>

    span.additional-info-icon {
        width: 18px;
        color:var(--grey-600);
        display:inline-block;
        vertical-align: middle;
        line-height: 1em;
        cursor: help;
        position:relative;
        text-transform: none;
    }

    div.input-item{
        font-family: var(--ui-font-family);
        color: var(--grey-999);
        font-size: 16px;
        margin-top: 1.25em;
        display:flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
    }

    input {
        box-sizing: border-box;
        border-radius: 4px 4px 4px 4px;
        border: 1px solid var(--grey-300);
        padding: 0.25em 0.25em 0.25em 0.25em;
        margin-left: auto;
        width: 65%;
        padding: 0.35em;
        color: var(--grey-999);
        -webkit-appearance: none;
        -moz-appearance: none;
        vertical-align:middle;
        font-size: 16px;
    }
    input:required {
       box-shadow: none;
    }
    input:focus{
        outline: none;
    }

    label {
        width: 30%;
        text-transform: uppercase;
        font-weight: normal;
        font-size: 14px;
        color: var(--grey-800)
    }

    .additional-info-icon .info-msg {
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

    .additional-info-icon:hover .info-msg {
        visibility: visible;
    }

</style>
