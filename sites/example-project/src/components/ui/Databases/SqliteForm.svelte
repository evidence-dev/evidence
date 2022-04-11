<script>
	export let credentials;
	export let existingCredentials;

	credentials = { ...existingCredentials };

    credentials = {
        filename: credentials.filename
    }

    let opts = [
        {
            id: "filename", 
            label: "Filename", 
            type: "text", 
            additionalInstructions: 'Name of file stored in the root of your Evidence project or an in-memory SQLite database (:memory:)',
            placeholder: "mydata.db",
            value: credentials.filename ?? ""}
    ]
    import GenericForm from './GenericForm.svelte'

</script>

<GenericForm {opts} bind:credentials={credentials}/>