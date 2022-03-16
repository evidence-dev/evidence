<script context="module">
    export const load = async ({fetch}) => {
        const res = await fetch("api/settings.json")
        const items = await res.json()

        return {
            props: {
                items
            }
        }
    }

</script>

<script>
    export let items
    let database = items.evidenceConfig.database
    let credentials = items.databaseConfig

    import BigqueryForm from '@evidence-dev/components/ui/Databases/BigqueryForm.svelte'
    import PostgresForm from '@evidence-dev/components/ui/Databases/PostgresForm.svelte'
    import SnowflakeForm from '@evidence-dev/components/ui/Databases/SnowflakeForm.svelte'
    import MysqlForm from '@evidence-dev/components/ui/Databases/MysqlForm.svelte'

    let databaseOptions = [
		{id: 'bigquery', name: 'BigQuery'},
		{id: 'postgres', name: 'PostgreSQL'},
		{id: 'mysql', name: 'MySQL'},
		{id: 'snowflake', name: 'Snowflake'}
	];

    let dbconnectors = {
        "bigquery": BigqueryForm,
        "postgres": PostgresForm,
        "snowflake": SnowflakeForm,
        "mysql": MysqlForm
    }

    async function submitForm() {
		const submit = await fetch("/api/settings.json", {
			method: "POST",
			body: JSON.stringify({
				database,
                credentials
			})
		})
	};

</script>

<h2>Select Your Database</h2>

<form on:submit|preventDefault={submitForm}>
    {#each databaseOptions as db}
        <input
            bind:group={database}
            type="radio"
            id={db.id}
            name="database"
            value={db.id}
        />
        <label for={db.id}>{db.name}</label><br/>
    {/each}

<svelte:component this={dbconnectors[database]} bind:credentials={credentials}/>

<button type=submit>Save</button>
</form>