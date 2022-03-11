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

</script>


<h2>BigQuery Credentials</h2>

{#each opts as opt}

    <div class=input-item>
        <label for={opt.id}>{opt.label}</label>
        <input
            type=text
            id={opt.id}
            name={opt.name}
            bind:value={credentials[opt.id]}
        />
    </div>

{/each}