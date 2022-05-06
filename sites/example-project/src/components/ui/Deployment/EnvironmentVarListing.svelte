<script>
    import VariableCopy from "./VariableCopy.svelte";
    export let settings
    let credentials = {}
    let targetEnvVars = []

    if(settings.credentials) {
        targetEnvVars =[{
            name: 'DATABASE',
            value: settings.database
        }]
        credentials = settings.credentials
        if(settings.database == 'bigquery') {
            credentials = {
                project_id: settings.credentials.project_id, 
                client_email: settings.credentials.client_email,
                private_key: settings.credentials.private_key
            }
        }
        for(const key in credentials) {
            if (key != 'gitignoreSqlite') {
                let envVar = {
                    name: settings.database.toUpperCase() + '_' + key.toUpperCase(),
                    value: settings.credentials[key]
                }
                targetEnvVars.push(envVar)
            }
        }
    }
</script>

<div class=titles>
    <span class=title>Key</span><span class=title>Value</span> 
</div>

{#each targetEnvVars as envVar }
    <div class=environment-variable>
        <div class=var-name>
            <VariableCopy text={envVar.name}/>
        </div>
        <div class=var-value>
            <VariableCopy text={envVar.value} hideText={true}/>
        </div>
    </div>
{/each}

<style>
    div.environment-variable{
        font-family: var(--ui-font-family);
        color: var(--grey-999);
        font-size: 16px;
        margin-bottom: 1.25em;
        display:flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    div.titles {
        font-family: var(--ui-font-family);
        color: var(--grey-999);
        font-size: 16px;
        margin-bottom: 0.25em;
        display:flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    div.var-value {
        margin-left: auto;
        width: 45%;
    }

    div.var-name {
        width: 45%;
    }

    span.title {
        width: 45%;
        font-size: 0.85em;
        color: var(--grey-800);
        text-transform: uppercase;
        letter-spacing: 0.07em;
    }
</style>


