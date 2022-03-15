<script>
    export let credentials

    credentials = {
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        projectKey: credentials.projectKey
    }

    let opts = [
        {id: "projectId", label: "Project ID", type: "text", value: credentials.projectId ?? ""},
        {id: "clientEmail", label: "Client Email", type: "text", value: credentials.clientEmail ?? ""},
        {id: "projectKey", label: "Project Key", type: "text", value: credentials.projectKey ?? ""}
    ]


    // Attempt to upload JSON keyfile:
    let files;
    
    async function saveFile(files) {
		const submit = await fetch("/api/keyFile.json", {
			method: "POST",
			body: JSON.stringify({
				files
			})
		})
	};
    ///////

</script>


<h2>BigQuery Credentials</h2>

{#each opts as opt}

    <div class=input-item>
        <label for={opt.id}>{opt.label}</label>
        <input
            type=text
            id={opt.id}
            name={opt.id}
            bind:value={credentials[opt.id]}
        />
    </div>

{/each}


<!-- attempt to upload JSON keyfile -->
<input 
    type="file" 
    accept="application/json"
    bind:files 
    on:change="{saveFile}"
>


{#if files && files[0]}
	<p>
		{files[0].name}
	</p>
{/if}

<!-- -->