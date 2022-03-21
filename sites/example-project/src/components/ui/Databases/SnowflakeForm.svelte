<script>
    export let credentials

    let opts = [
        {id: "account", label: "Account", type: "text", value: credentials.account ?? ""},
        {id: "username", label: "Username", type: "text", value: credentials.username ?? ""},
        {id: "password", label: "Password", type: "password", value: credentials.password ?? ""},
    ]

    import GenericForm from './GenericForm.svelte'

</script>

<GenericForm {opts} bind:credentials={credentials}/>