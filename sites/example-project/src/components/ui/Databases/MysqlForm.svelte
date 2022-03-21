<script>
    export let credentials

    credentials = {
        host: credentials.host,
        database: credentials.database,
        user: credentials.user,
        password: credentials.password,
        socketPath: credentials.socketPath
    }

    let opts = [
        {id: "host", label: "Host", type: "text", value: credentials.host ?? ""},
        {id: "database", label: "Database", type: "text", value: credentials.database ?? ""},
        {id: "user", label: "User", type: "text", value: credentials.user ?? ""},
        {id: "password", label: "Password", type: "password", value: credentials.password ?? ""},
        {id: "socketPath", label: "Socket Path (optional)", type: "text", value: credentials.socketPath ?? ""}
    ]
    import GenericForm from './GenericForm.svelte'

</script>

<GenericForm {opts} bind:credentials={credentials}/>