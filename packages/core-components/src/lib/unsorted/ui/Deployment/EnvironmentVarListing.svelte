<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import VariableCopy from './VariableCopy.svelte';
	export let settings;
	let credentials = {};
	let targetEnvVars = [];

	if (settings.credentials) {
		targetEnvVars = [
			{
				name: 'DATABASE',
				value: settings.database
			}
		];
		credentials = settings.credentials;
		if (settings.database == 'bigquery') {
			if (credentials.authenticator === 'service-account') {
				credentials = {
					project_id: settings.credentials.project_id,
					client_email: settings.credentials.client_email,
					private_key: settings.credentials.private_key
				};
			} else if (credentials.authenticator === 'oauth') {
				credentials = {
					project_id: settings.credentials.project_id,
					token: settings.credentials.token
				};
			} else if (credentials.authenticator === 'gcloud-cli') {
				credentials = {
					project_id: settings.credentials.project_id
				};
			}
		}
		if (settings.database == 'snowflake') {
			if (credentials.authenticator === 'externalbrowser') {
				credentials = {
					account: settings.credentials.account,
					username: settings.credentials.username,
					warehouse: settings.credentials.warehouse,
					database: settings.credentials.database
				};
			} else if (credentials.authenticator === 'okta') {
				credentials = {
					okta_url: settings.credentials.okta_url,
					account: settings.credentials.account,
					username: settings.credentials.username,
					password: settings.credentials.password,
					warehouse: settings.credentials.warehouse,
					database: settings.credentials.database
				};
			} else if (credentials.authenticator === 'snowflake_jwt') {
				credentials = {
					account: settings.credentials.account,
					username: settings.credentials.username,
					private_key: settings.credentials.private_key,
					passphrase: settings.credentials.passphrase,
					warehouse: settings.credentials.warehouse,
					database: settings.credentials.database
				};
			} else {
				credentials = {
					account: settings.credentials.account,
					username: settings.credentials.username,
					password: settings.credentials.password,
					warehouse: settings.credentials.warehouse,
					database: settings.credentials.database
				};
			}
		}
		for (const key in credentials) {
			if (key != 'gitignoreSqlite') {
				let envVar = {
					name: settings.database.toUpperCase() + '_' + key.toUpperCase(),
					value: settings.credentials[key]
				};
				targetEnvVars.push(envVar);
			}
		}
	}
</script>

<p>
	To use different data environments in production vs development, <a
		class="docs-link"
		href="https://docs.evidence.dev/deployment/environments"
		>use different environment variable values.</a
	>
</p>
<div class="titles">
	<span class="title">Key</span><span class="title">Value</span>
</div>

{#each targetEnvVars as envVar}
	<div class="environment-variable">
		<div class="var-name">
			<VariableCopy text={envVar.name} />
		</div>
		<div class="var-value">
			<VariableCopy text={envVar.value} hideText={true} />
		</div>
	</div>
{/each}

<style>
	div.environment-variable {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-bottom: 1.25em;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	div.titles {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-bottom: 0.25em;
		display: flex;
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

	.docs-link {
		color: var(--blue-600);
		text-decoration: none;
	}

	.docs-link:hover {
		color: var(--blue-800);
	}
</style>
