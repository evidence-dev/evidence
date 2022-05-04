<script>
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
</script>