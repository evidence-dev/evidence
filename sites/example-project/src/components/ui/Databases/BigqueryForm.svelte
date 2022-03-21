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

<input 
    type="file" 
    accept="application/json"
    bind:files
    on:change={handleUpload}
/>
