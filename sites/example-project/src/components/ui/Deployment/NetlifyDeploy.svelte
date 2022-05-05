<script>
    import EnvironmentVarListing from "./EnvironmentVarListing.svelte";
    export let settings
    let targetEnvVars = {}

    if(settings.credentials) {
        if(settings.database === 'bigquery') {
            targetEnvVars = {
                BIGQUERY_PROJECT_ID: settings.credentials.project_id, 
                BIGQUERY_CLIENT_EMAIL: settings.credentials.client_email,
                BIGQUERY_PRIVATE_KEY: settings.credentials.private_key
            }
        }
        else {
            for(const key in settings.credentials) {
                targetEnvVars[settings.database.toUpperCase() + '_' + key.toUpperCase()] = settings.credentials[key]
            }
        }
    }

    let hrefComponents = []

    for(const key in targetEnvVars){ 
        hrefComponents.push(key+'='+targetEnvVars[key])
    }

</script>

{#if !settings.credentials}
<p>You'll need to connect to a database before deploying to netlify.</p>
{:else if !settings.gitRepo}
<p>You'll need to set up a git repo before deploying to netlify.</p>
{:else }

<h2>Deploying to Netlify</h2>

<ol>
    <li><a href='https://app.netlify.com/start' target=_blank>Start a new netlify project &rarr;</a></li>
    <li>Authorize netlify with your git provider</li>
    <li>Choose this repo <code>{settings.gitRepo}</code></li>
    <li>Update the settings to match those below</li>
</ol>

<h2>Basic Build Settings</h2>

<span>Build command</span>
<p>
    <code>npm run build</code>

</p>

<span>Publish directory</span>
<p>
    <code>build/</code>
</p>

<h2>Advanced Build Settings</h2>
<p>Click `Show Advanced` and copy/paste the following variable names and variables</p>

<EnvironmentVarListing {settings}/>



{/if}

<style>
    a {
        color: var(--blue-600);
        text-decoration: none;
    }

    a:hover {
        color: var(--blue-800);
        text-decoration: none;
    }

</style>