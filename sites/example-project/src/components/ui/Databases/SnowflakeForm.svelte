<script>
    export let credentials

    credentials = {
        account: credentials.account,
        username: credentials.username,
        password: credentials.password,
    }

    let opts = [
        {id: "account", label: "Account", type: "text", value: credentials.account ?? ""},
        {id: "username", label: "Username", type: "text", value: credentials.username ?? ""},
        {id: "password", label: "Password", type: "password", value: credentials.password ?? ""},
    ]

</script>


<h2>Snowflake Credentials</h2>

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
