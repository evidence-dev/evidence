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


<h2>BigQuery Credentials</h2>
<p>Load yer' key file:</p> 

<input 
    type="file" 
    accept="application/json"
    bind:files
    on:change={handleUpload}
/>
