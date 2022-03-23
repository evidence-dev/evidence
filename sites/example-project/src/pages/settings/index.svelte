<script context="module">
    export const load = async ({fetch}) => {
        const res = await fetch("../api/settings.json")
        const settings = await res.json()
        return {
            props: {
                settings
            }
        }
    }
</script>


<script>
    // DB Forms 
    import BigqueryForm from '$lib/ui/Databases/BigqueryForm.svelte'
    import PostgresForm from '$lib/ui/Databases/PostgresForm.svelte'
    import SnowflakeForm from '$lib/ui/Databases/SnowflakeForm.svelte'
    import MysqlForm from '$lib/ui/Databases/MysqlForm.svelte'

    export let settings 

    let credentials = settings.databaseConfig

    // TODO: the save / existing / no save if no change flow is jank right now 


    // Available connector types, including a fallback
    const databaseOptions = [
        {id: '', name: 'Choose a database'},
		{id: 'bigquery', name: 'BigQuery', formComponent: BigqueryForm},
		{id: 'postgres', name: 'PostgreSQL', formComponent: PostgresForm},
		{id: 'mysql', name: 'MySQL', formComponent: MysqlForm},
		{id: 'snowflake', name: 'Snowflake', formComponent: SnowflakeForm}
	];

	let selectedDatabase = databaseOptions.filter(d => d.id === settings.evidenceConfig.database)[0];

    async function submitForm() {
		const submit = await fetch("/api/settings.json", {
			method: "POST",
			body: JSON.stringify({
				database: selectedDatabase.id,
                credentials
			})
		})
	};

</script>


<form on:submit|preventDefault={submitForm} autocomplete="off">
    <div class=container>
        <div class=panel> 
            <h1>Database Connection</h1>
            <p>Evidence supports one database connection per project.</p>
            <h2>Connection Type</h2>
            <select bind:value={selectedDatabase}>
            {#each databaseOptions as option}
                <option value={option}>
                    {option.name}
                </option>
            {/each}
            </select>
            <svelte:component this={selectedDatabase.formComponent} bind:credentials={credentials}/>
        </div> 
    </div>
    <footer>
        {#if selectedDatabase.id === ''}
        <span>Learn more about Database Connection Settings &rarr;</span> 
        {:else}
        <span>Learn more about {selectedDatabase.name} Connection Settings &rarr;</span> 
        {/if}
        <button type=submit id=save>Save</button>
    </footer>
</form>


<style> 
h2 {
    text-transform: uppercase;
    font-weight: normal;
    font-size: 14px;
}

.container {
    border-top: 1px solid var(--grey-200);
    border-left: 1px solid var(--grey-200);
    border-right: 1px solid var(--grey-200);
    border-radius: 5px 5px 0 0;
    font-size: 14px; 
    font-family: var(--ui-font-family);
}

.panel {
    border-top: 1px solid var(--grey-200);
    padding:1.0em;
}

.panel:first-of-type {
    border-top:none;
}

select {
   -webkit-appearance: none;
   -moz-appearance: none;
   appearance: none;   
   padding:0.75em;
   width: 100%;
   border: 1px solid var(--grey-200); 
   font-family: var(--ui-font-family);
   color: var(--grey-800); 
   margin: 0.5em 0 0 0; 
}

select:focus {
    outline: none;

}

footer {
    border: 1px solid var(--grey-200);
    border-radius: 0 0 5px 5px;
    background-color: var(--grey-100);
    padding:1.0em;
    display:flex;
    font-size: 14px;
    align-items: center;
    font-family: var(--ui-font-family);
}

button {
    padding:0.4em 0.5em;
    margin-right: 0.25em;
    margin-left: auto;
    font-style: normal;
    text-decoration: none;
    font-size:14px;
    cursor:pointer;
}
    
button:hover {
    box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
    transition:all 350ms;
}

#save {
    background-color: var(--blue-600);
    color:white;
    font-weight: bold;
    border-radius: 4px;
    border: 1px solid var(--blue-700);
    padding:0.4em 1.10em;
    transition-property: background, color;
    transition-duration: 350ms;
}

#save:active {
    background-color: var(--blue-800);
    color:white;
    font-weight: bold;
    border-radius: 4px;
    border: 1px solid var(--blue-900);
    padding:0.4em 1.10em;
    transition-property: background, color;
    transition-duration: 350ms;
}

</style>