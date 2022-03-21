<script>
    export let credentials

    let files;

    async function handleUpload() {
        for (const file of files) {
            const fileContents = await file.text()
            credentials = JSON.parse(fileContents)
        }
    }

</script>


<hr/>

<!-- svelte-ignore a11y-label-has-associated-control -->
<div class=input-item>

<label>
    JSON Keyfile
</label>
<input 
    type="file" 
    accept="application/json"
    bind:files
    on:change={handleUpload}
/>
</div>

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
        margin-left: auto;
        margin-right: 2em;
        padding: 0.35em;
    }

</style>