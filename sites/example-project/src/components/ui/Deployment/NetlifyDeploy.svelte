<script>
    import BigLink from "../BigLink.svelte"

    export let settings

    let netlifyHref

    if(settings.credentials) {
        netlifyHref = `
            https://app.netlify.com/start/deploy?repository=${settings.gitRepo.replace('.git', '')}#BIGQUERY_PROJECT_ID=${settings.credentials.project_id}&BIGQUERY_CLIENT_EMAIL=${settings.credentials.client_email}&BIGQUERY_PRIVATE_KEY=${settings.credentials.private_key}
        `
    }


</script>

<h2>Netlify</h2>
<p>Netlify offers... lorem ipsum</p>
<h3>Pre-requisites</h3>

{#if !settings.credentials}

<p>Connect to a database first</p>

{:else if !settings.gitRepo}

<p>Set up a git repository</p>

{:else }

<BigLink href={netlifyHref}>Deploy to Netlify &rarr</BigLink>

{/if}