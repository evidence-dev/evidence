<script>
	export let credentials;
	export let existingCredentials;
    export let disableSave;

	credentials = { ...existingCredentials };

    credentials = {
        url: credentials.url,
        port: credentials.port,
        database: credentials.database,
        user: credentials.user,
        password: credentials.password,
    }

    let opts = [
        {
            id: "url", 
            label: "URL", 
            type: "text", 
            optional: true, 
            override: false,
            placeholder: "database.server.com", 
            value: credentials.host ?? ""
        },
        {
            id: "port", 
            label: "Port", 
            type: "text", 
            optional: true, 
            override: false,
            placeholder: "8123", 
            value: credentials.port ?? "8123",
        },
        {
            id: "database", 
            label: "Database", 
            optional: false, 
            override: false,
            placeholder: "my-database-name", 
            type: "text", 
            value: credentials.database ?? ""
        },
        {
            id: "user", 
            label: "User", 
            type: "text", 
            optional: false, 
            override: false,
            placeholder: "username", 
            value: credentials.user ?? ""
        },
        {
            id: "password", 
            label: "Password", 
            type: "password", 
            optional: false, 
            override: false,
            placeholder: "password", 
            value: credentials.password ?? ""
        },
    ]
    import GenericForm from './GenericForm.svelte'

</script>

<GenericForm {opts} bind:credentials={credentials} bind:disableSave/>