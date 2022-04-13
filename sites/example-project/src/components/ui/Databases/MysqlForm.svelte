<script>
	export let credentials;
	export let existingCredentials;
    export let disableSave;

	credentials = { ...existingCredentials };

    credentials = {
        host: credentials.host,
        database: credentials.database,
        user: credentials.user,
        password: credentials.password,
        socketPath: credentials.socketPath
    }

    let opts = [
        {id: "host", label: "Host", type: "text", placeholder: "database.server.com", value: credentials.host ?? ""},
        {id: "database", label: "Database", placeholder: "my-database-name", type: "text", value: credentials.database ?? ""},
        {id: "user", label: "User", type: "text", placeholder: "username", value: credentials.user ?? ""},
        {id: "password", label: "Password", type: "password", placeholder: "password", value: credentials.password ?? ""},
        {
            id: "socketPath", 
            label: "Socket Path", 
            type: "text", 
            additionalInstructions:
				'This is an optional field, when using XYZ this is commonly required.',
            optional: true,
            value: credentials.socketPath ?? ""
        }
    ]
    import GenericForm from './GenericForm.svelte'

</script>

<GenericForm {opts} bind:credentials={credentials} bind:disableSave/>