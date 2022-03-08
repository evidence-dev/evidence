

<script>
	// let dbConfig = JSON.parse(fs.readFileSync('.evidence/database.config.json', 'utf8'));

	export let database;

    let databaseOptions = [
		{
			id: 'bigquery',
			name: 'BigQuery',
			authTypes: [
				{
					id: 'oauth',
					name: 'OAuth'
				},
				{
					id: 'serviceAccount',
					name: 'Service Account'
				}
			]
		},
		{
			id: 'postgres',
			name: 'PostgreSQL',
			authTypes: [
				{
					id: 'oauth',
					name: 'OAuth'
				},
				{
					id: 'serviceAccount',
					name: 'Service Account'
				}
			]
		},
		{
			id: 'mysql',
			name: 'MySQL',
			authTypes: [
				{
					id: 'oauth',
					name: 'OAuth'
				},
				{
					id: 'serviceAccount',
					name: 'Service Account'
				}
			]
		},
		{
			id: 'snowflake',
			name: 'Snowflake',
			authTypes: [
				{
					id: 'oauth',
					name: 'OAuth'
				},
				{
					id: 'serviceAccount',
					name: 'Service Account'
				}
			]
		}
	];

	let authType;

	async function submitForm() {
		const submit = await fetch("/api/settings.json", {
			method: "POST",
			body: JSON.stringify({
				database
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
	<label for={db.id}>{db.name}</label><br />
{/each}
<button type=submit>Save</button>
</form>

{#if database != null}
	<h2 class={JSON.stringify(databaseOptions.filter((d) => d.id === database)[0].authTypes)}>
		Select Auth Type
	</h2>
	{#each databaseOptions.filter((d) => d.id === database)[0].authTypes as auth}
		<input bind:group={authType} type="radio" id={auth.id} name="authType" value={auth.id} />
		<label for={auth.id}>{auth.name}</label><br />
	{/each}
{/if}

<!-- <input bind:group={database} type=radio id=bigquery name=database value="bigquery" on:change={onChange}/>
<label for=bigquery>BigQuery</label><br>
<input bind:group={database} type=radio id=snowflake name=database value="snowflake" on:change={onChange}/>
<label for=snowflake>Snowflake</label><br>
<input bind:group={database} type=radio id=postgres name=database value="postgres" on:change={onChange}/>
<label for=postgres>PostgreSQL</label><br>
<input bind:group={database} type=radio id=mysql name=database value="mysql" on:change={onChange}/>
<label for=mysql>MySQL</label><br> -->
