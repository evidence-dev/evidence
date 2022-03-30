<script>
    export let credentials
    export let existingCredentials

    credentials = {...existingCredentials}

    let opts = [
        {
            id: "account", 
            label: "Account", 
            type: "text", 
            placeholder: "xx16244.us-central1.gcp",
            value: credentials.account},
        {
            id: "username", 
            label: "Username", 
            type: "text", 
            placeholder: "weyland-yutani",
            value: credentials.username},
        {
            id: "password", 
            label: "Password", 
            type: "password", 
            value: credentials.password
        }
    ]

    import GenericForm from './GenericForm.svelte'

</script>

<GenericForm {opts} bind:credentials />
