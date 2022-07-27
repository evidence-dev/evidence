<script>
    import IoIosHelpCircleOutline from 'svelte-icons/io/IoIosHelpCircleOutline.svelte'

    export let opts
    export let credentials
    export let disableSave

    let requiredOpts = opts.filter(d => d.optional !== true);
    let optionalOpts = opts.filter(d => d.optional === true);
    let overrideOpts = opts.filter(d => d.optional === true && d.override === true)

    function handleChange() {
        let filledFields = 0;
        let fieldStatus = false;

        let overrideFields = 0;
        let overrideFieldStatus = false;

        for(let i=0; i<requiredOpts.length; i++){
            fieldStatus = credentials[requiredOpts[i].id] != undefined && credentials[requiredOpts[i].id] !== '';
            filledFields = filledFields + fieldStatus;
        }

        for(let j=0; j<overrideOpts.length; j++){
            overrideFieldStatus = credentials[overrideOpts[j].id] != undefined && credentials[overrideOpts[j].id] !== '';
            overrideFields = overrideFields + overrideFieldStatus;
        }

        if(filledFields === requiredOpts.length || overrideFields > 0){
            disableSave = false;
        } else {
            disableSave = true;
        }

    }

</script>

{#each requiredOpts as opt}

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
        <input
            type=text
            id={opt.id}
            name={opt.id}
            data-test-id={opt.dataTestId ?? opt.id}
            bind:value={credentials[opt.id]}
            placeholder={opt.placeholder}
            on:keyup={handleChange}
        />
    {:else if opt.type === "password"}
        <input
            type=password
            id={opt.id}
            name={opt.id}
            data-test-id={opt.dataTestId ?? opt.id}
            placeholder="password"
            bind:value={credentials[opt.id]}
            on:keyup={handleChange}
            />
    {/if}
</div>

{/each}

{#if optionalOpts.length > 0}
<div class="separator">Optional</div>
{/if}

{#each optionalOpts as opt}
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
        <input
            type=text
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
            placeholder={opt.placeholder}
            on:keyup={handleChange}
        />
    {:else if opt.type === "password"}
        <input
            type=password
            id={opt.id}
            name={opt.id}
            placeholder="password"
            bind:value={credentials[opt.id]}
            on:keyup={handleChange}
        />
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
        margin-top: 1.1em;
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
        width: 62%;
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
        width: 35%;
        text-transform: uppercase;
        font-weight: normal;
        font-size: 14px;
        color: var(--grey-800)
    }

    .additional-info-icon .info-msg {
        visibility: hidden;
        display: none;
        position: absolute;
        top: -5px;
        left: 105%;
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
        max-width: 200px;
        min-width: 150px;
    }

    .additional-info-icon:hover .info-msg {
        visibility: visible;
        display: inline;
    }

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
