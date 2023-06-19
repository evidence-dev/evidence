<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import AuthSelect from './AuthSelect.svelte';

	export let credentials;
	export let existingCredentials;
	export let disableSave;

	credentials = { ...existingCredentials };
	credentials.project_id = credentials.project_id ?? '';
	credentials.authenticator = credentials.authenticator ?? 'service-account';

	let files;

	async function handleUpload() {
		for (const file of files) {
			const fileContents = await file.text();
			credentials = { ...credentials, ...JSON.parse(fileContents) };
		}
		disableSave = false;
	}

	$: disableSave = !credentials.project_id;

	const options = [
		{
			value: 'service-account',
			description: 'Service Account (default)'
		},
		{
			value: 'gcloud-cli',
			description: 'GCloud CLI'
		},
		{
			value: 'oauth',
			description: 'OAuth Access Token'
		}
	];
</script>

<AuthSelect {options} bind:selected={credentials.authenticator} />

{#if credentials.authenticator === 'service-account'}
	<div class="input-item">
		<label for="file-input"> JSON Keyfile </label>
		{#if credentials.project_id}
			<input
				id="file-input"
				type="file"
				accept="application/json"
				bind:files
				on:change={handleUpload}
			/>
		{:else}
			<input
				id="file-input"
				type="file"
				accept="application/json"
				bind:files
				on:change={handleUpload}
				required
			/>
		{/if}
	</div>
	<div class="input-item">
		<label for="project"> Project ID </label>
		<input
			type="text"
			id="project"
			name="project"
			value={credentials?.project_id ?? ' '}
			disabled
		/>
	</div>
	<div class="input-item">
		<label for="private-key"> Private Key </label>
		<input type="password" id="private-key" value={credentials?.private_key ?? ''} disabled />
	</div>
	<div class="input-item">
		<label for="client-email"> Client Email </label>
		<input type="text" id="client-email" value={credentials?.client_email ?? ' '} disabled />
	</div>
{:else if credentials.authenticator === 'oauth'}
	<div class="input-item">
		<label for="project-id"> Project ID </label>
		<input type="text" id="project-id" bind:value={credentials.project_id} />
	</div>
	<div class="input-item">
		<label for="token"> Access Token </label>
		<input type="text" id="token" bind:value={credentials.token} />
	</div>
{:else}
	<!-- gcloud -->
	<div class="mt-5">
		<p>
			If you have the <a rel="noreferrer" target="_blank" href="https://cloud.google.com/sdk/gcloud"
				>gcloud CLI</a
			> installed, you can log in to BigQuery using the following command. Evidence will use the credentials
			stored by the gcloud CLI to connect to BigQuery.
		</p>
		<pre><code class="block p-1">gcloud auth application-default login</code></pre>
	</div>

	<div class="input-item">
		<label for="project-id"> Project ID </label>
		<input type="text" id="project-id" bind:value={credentials.project_id} />
	</div>
{/if}

<style>
	div.input-item {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-top: 1.25em;
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	input {
		box-sizing: border-box;
		border-radius: 4px 4px 4px 4px;
		border: 1px solid var(--grey-300);
		padding: 0.25em 0.25em 0.25em 0.25em;
		margin-left: auto;
		width: 65%;
		padding: 0.35em;
		color: var(--grey-999);
		-webkit-appearance: none;
		-moz-appearance: none;
		vertical-align: middle;
		font-size: 14px;
	}
	input:required {
		box-shadow: none;
	}
	input:focus {
		outline: none;
	}
	input:disabled {
		background-color: var(--grey-100);
		cursor: not-allowed;
	}

	label {
		width: 30%;
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		color: var(--grey-800);
	}
</style>
