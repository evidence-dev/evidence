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
			if (credentials.authenticator === 'oauth') {
				credentials = {
					project_id: credentials.project_id,
					token: credentials.token
				};
			} else if (credentials.authenticator === 'gcloud-cli') {
				credentials = {
					project_id: credentials.project_id
				};
			} else {
				credentials = {
					project_id: credentials.project_id,
					client_email: credentials.client_email,
					private_key: credentials.private_key
				};
			}
			if (settings.credentials.authenticator)
				credentials.authenticator = settings.credentials.authenticator;
		}
		if (settings.database == 'snowflake') {
			if (credentials.authenticator === 'externalbrowser') {
				credentials = {
					account: credentials.account,
					username: credentials.username,
					warehouse: credentials.warehouse,
					database: credentials.database
				};
			} else if (credentials.authenticator === 'okta') {
				credentials = {
					okta_url: credentials.okta_url,
					account: credentials.account,
					username: credentials.username,
					password: credentials.password,
					warehouse: credentials.warehouse,
					database: credentials.database
				};
			} else if (credentials.authenticator === 'snowflake_jwt') {
				credentials = {
					account: credentials.account,
					username: credentials.username,
					private_key: credentials.private_key,
					passphrase: credentials.passphrase,
					warehouse: credentials.warehouse,
					database: credentials.database
				};
			} else {
				credentials = {
					account: credentials.account,
					username: credentials.username,
					password: credentials.password,
					warehouse: credentials.warehouse,
					database: credentials.database
				};
			}
			if (settings.credentials.authenticator)
				credentials.authenticator = settings.credentials.authenticator;
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

{#if credentials.authenticator === 'externalbrowser'}
	<hr />
	<p>
		External browser authentication isn't supported in cloud deployments, as it needs access to a
		browser. Set up one of the other authentication options for a deployment.
	</p>
{:else if credentials.authenticator === 'gcloud-cli'}
	<hr />
	<p>
		GCloud authentication isn't supported in cloud deployments, as it needs access to a browser. Set
		up one of the other authentication options for a deployment.
	</p>
{:else}
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
{/if}

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
