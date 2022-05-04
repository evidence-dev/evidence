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

<h1>Netlify</h1>

{#if !settings.credentials}

<p>Connect to a database first</p>

{:else if !settings.gitRepo}

{:else }

<p>Use the button below to createa new Netlify site based for this project.</p>

<a href={netlifyHref}><img src="https://www.netlify.com/img/deploy/button.svg"></a>

<p>This will pre-populate your netlify with environment variables for your database connection, and connect it to your git repo.</p>

{/if}

