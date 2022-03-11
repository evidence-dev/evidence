<script>
    export let credentials

    credentials = {
        host: credentials.host,
        database: credentials.database,
        user: credentials.user,
        password: credentials.password,
        port: credentials.port,
        ssl: credentials.ssl,
        connectionString: credentials.connectionString
    }

    let opts = [
        {id: "host", label: "Host", type: "text", value: credentials.host ?? ""},
        {id: "database", label: "Database", type: "text", value: credentials.database ?? ""},
        {id: "user", label: "User", type: "text", value: credentials.user ?? ""},
        {id: "password", label: "Password", type: "password", value: credentials.password ?? ""},
        {id: "port", label: "Port", type: "text", value: credentials.port ?? ""},
        {id: "ssl", label: "SSL (optional)", type: "text", value: credentials.ssl ?? ""},
        {id: "connectionString", label: "Connection String (optional)", type: "text", value: credentials.connectionString ?? ""}
    ]

</script>


<h2>Postgres Credentials</h2>

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

