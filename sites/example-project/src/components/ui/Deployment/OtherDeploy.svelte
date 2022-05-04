<script>
    export let settings
    let targetEnvVars = []

    if(settings.credentials) {
        for(const key in settings.credentials) {
            let envVar = {
                name: settings.database.toUpperCase() + '_' + key.toUpperCase(),
                value: settings.credentials[key]
            }
            targetEnvVars.push(envVar)
        }
    }

</script>

<p>
    Your Evidence project will run in any environment that runs node.
</p>

<h2>
    Build command 
</h2>
<p>
    <code>npm run build</code>
</p>

<h2>Output directory</h2>
<p>
    <code>/build</code>
</p>

<h2>Environment variables</h2>
<p>The following environment variables are required for your database connection: </p>

{#each targetEnvVars as envVar }
<div class=environment-variable>
    <span class=var-name>{envVar.name}: </span> <span class=var-value>{envVar.value}</span>
</div>
{/each}

<style>
    div.environment-variable{
        font-family: var(--ui-font-family);
        color: var(--grey-999);
        font-size: 16px;
        margin-top: 1.25em;
        display:flex;
        flex-direction: row;
        align-items: center;
    }
</style>


