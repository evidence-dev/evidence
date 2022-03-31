<script>
    export let credentials
    export let existingCredentials

    credentials = {...existingCredentials}

    let files;

    async function handleUpload() {
        for (const file of files) {
            const fileContents = await file.text()
            credentials = JSON.parse(fileContents)
        }
    }

</script>


<!-- svelte-ignore a11y-label-has-associated-control -->
<div class=input-item>

<label>
    JSON Keyfile
</label>
{#if credentials.project_id && credentials.private_key && credentials.client_email}
<input id=file-input
    type="file" 
    accept="application/json"
    bind:files
    on:change={handleUpload}
/>
{:else}
<input id=file-input
    type="file" 
    accept="application/json"
    bind:files
    on:change={handleUpload}
    required
/>
{/if}

</div>

<div class=input-item>
    <label for=project>
        Project ID
    </label>
        <input
            type=text
            id=project
            name=project
            value={credentials?.project_id ?? ' '}
            disabled
            
        />
</div>
<div class=input-item>
    <label for=pk>
        Private Key
    </label>
        <input
            type=password
            id=pk
            value={credentials?.private_key ?? ''}
            disabled
            
        />
</div>
<div class=input-item>
    <label for=client-email>
        Client Email
    </label>
        <input
            type=text
            id=client-email
            value={credentials?.client_email ?? ' '}
            disabled
            
        />
</div>

<style>

    div.input-item{
        font-family: var(--ui-font-family);
        color: var(--grey-999);
        font-size: 16px;
        margin-top: 1.25em;
        display:flex;
        flex-direction: row;
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
    input:disabled {
        background-color: var(--grey-100);
        cursor:not-allowed;
    }

    label {
        width: 30%;
        text-transform: uppercase;
        font-weight: normal;
        font-size: 14px;
        color: var(--grey-800)
    }
</style>