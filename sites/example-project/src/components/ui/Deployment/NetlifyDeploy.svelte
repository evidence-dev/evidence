<script>
    export let settings

    let netlifyHref 
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

    netlifyHref = `https://app.netlify.com/start/deploy?repository=${settings.gitRepo.replace('.git', '')}#` + hrefComponents.join('&')

</script>

{#if !settings.credentials}
<p>You'll need to connect to a database before deploying to netlify.</p>
{:else if !settings.gitRepo}
<p>You'll need to set up a git repo before deploying to netlify.</p>
{:else }

<p>The Deploy to Netlify button below will create a new netlify project: </p>
<ol>
    <li>Connected to the git repo: <code>{settings.gitRepo}</code> </li>
    <li>Pre-populated with the required environment variables for your {settings.database} connection.</li>
</ol>

<a href={netlifyHref}><img src="https://www.netlify.com/img/deploy/button.svg"></a>

{/if}

<style>

</style>