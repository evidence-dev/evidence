<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import GenericForm from './GenericForm.svelte';
	import AuthSelect from './AuthSelect.svelte';

	export let credentials;
	export let existingCredentials;
	export let disableSave;

	credentials = { ...existingCredentials };
	credentials.authenticator = 'snowflake';

	const opts = {
		snowflake: [
			{
				id: 'account',
				label: 'Account',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'xy12345.us-east4.gcp | xy12345.eu-west-1 | xy12345',
				value: credentials.account,
				dataTestId: 'snowflakeAccount',
				additionalInstructions:
					'The account number typically uses one of these formats: xy12345.us-east4.gcp, xy12345.eu-west-1 or xy12345. For more info see https://docs.snowflake.com/en/user-guide/admin-account-identifier'
			},
			{
				id: 'username',
				label: 'Username',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'weyland-yutani',
				value: credentials.username,
				dataTestId: 'snowflakeUsername'
			},
			{
				id: 'password',
				label: 'Password',
				type: 'password',
				optional: false,
				override: false,
				value: credentials.password,
				dataTestId: 'snowflakePassword'
			},
			{
				id: 'database',
				label: 'Database',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my-database',
				value: credentials.database,
				dataTestId: 'snowflakeDatabase'
			},
			{
				id: 'warehouse',
				label: 'Warehouse',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my_wh',
				value: credentials.warehouse,
				dataTestId: 'snowflakeWarehouse'
			},
			{
				id: 'role',
				label: 'Role',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.role,
				dataTestId: 'snowflakeRole'
			},
			{
				id: 'schema',
				label: 'Schema',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.schema,
				dataTestId: 'snowflakeSchema'
			}
		],
		okta: [
			{
				id: 'okta_url',
				label: 'Okta URL',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'https://your-organization.okta.com',
				value: credentials.okta_url,
				dataTestId: 'oktaUrl'
			},
			{
				id: 'account',
				label: 'Account',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'xy12345.us-east4.gcp | xy12345.eu-west-1 | xy12345',
				value: credentials.account,
				dataTestId: 'snowflakeAccount',
				additionalInstructions:
					'The account number typically uses one of these formats: xy12345.us-east4.gcp, xy12345.eu-west-1 or xy12345. For more info see https://docs.snowflake.com/en/user-guide/admin-account-identifier'
			},
			{
				id: 'username',
				label: 'Okta Username',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'weyland-yutani',
				value: credentials.username,
				dataTestId: 'snowflakeUsername'
			},
			{
				id: 'password',
				label: 'Okta Password',
				type: 'password',
				optional: false,
				override: false,
				value: credentials.password,
				dataTestId: 'snowflakePassword'
			},
			{
				id: 'database',
				label: 'Database',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my-database',
				value: credentials.database,
				dataTestId: 'snowflakeDatabase'
			},
			{
				id: 'warehouse',
				label: 'Warehouse',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my_wh',
				value: credentials.warehouse,
				dataTestId: 'snowflakeWarehouse'
			},
			{
				id: 'role',
				label: 'Role',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.role,
				dataTestId: 'snowflakeRole'
			},
			{
				id: 'schema',
				label: 'Schema',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.schema,
				dataTestId: 'snowflakeSchema'
			}
		],
		externalbrowser: [
			{
				id: 'account',
				label: 'Account',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'xy12345.us-east4.gcp | xy12345.eu-west-1 | xy12345',
				value: credentials.account,
				dataTestId: 'snowflakeAccount',
				additionalInstructions:
					'The account number typically uses one of these formats: xy12345.us-east4.gcp, xy12345.eu-west-1 or xy12345. For more info see https://docs.snowflake.com/en/user-guide/admin-account-identifier'
			},
			{
				id: 'username',
				label: 'Username',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'weyland-yutani',
				value: credentials.username,
				dataTestId: 'snowflakeUsername'
			},
			{
				id: 'database',
				label: 'Database',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my-database',
				value: credentials.database,
				dataTestId: 'snowflakeDatabase'
			},
			{
				id: 'warehouse',
				label: 'Warehouse',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my_wh',
				value: credentials.warehouse,
				dataTestId: 'snowflakeWarehouse'
			},
			{
				id: 'role',
				label: 'Role',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.role,
				dataTestId: 'snowflakeRole'
			},
			{
				id: 'schema',
				label: 'Schema',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.schema,
				dataTestId: 'snowflakeSchema'
			}
		],
		snowflake_jwt: [
			{
				id: 'account',
				label: 'Account',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'xy12345.us-east4.gcp | xy12345.eu-west-1 | xy12345',
				value: credentials.account,
				dataTestId: 'snowflakeAccount',
				additionalInstructions:
					'The account number typically uses one of these formats: xy12345.us-east4.gcp, xy12345.eu-west-1 or xy12345. For more info see https://docs.snowflake.com/en/user-guide/admin-account-identifier'
			},
			{
				id: 'username',
				label: 'Username',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'username',
				value: credentials.username,
				dataTestId: 'snowflakeUsername'
			},
			{
				id: 'database',
				label: 'Database',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my-database',
				value: credentials.database,
				dataTestId: 'snowflakeDatabase'
			},
			{
				id: 'warehouse',
				label: 'Warehouse',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'my_wh',
				value: credentials.warehouse,
				dataTestId: 'snowflakeWarehouse'
			},
			{
				id: 'role',
				label: 'Role',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.role,
				dataTestId: 'snowflakeRole'
			},
			{
				id: 'schema',
				label: 'Schema',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'public',
				value: credentials.schema,
				dataTestId: 'snowflakeSchema'
			},
			{
				id: 'passphrase',
				label: 'Private Key Passphrase',
				type: 'password',
				optional: true,
				override: false,
				value: credentials.passphrase,
				dataTestId: 'passphrase'
			}
		]
	};

	const options = [
		{
			value: 'snowflake',
			description: 'Snowflake Account (default)'
		},
		{
			value: 'externalbrowser',
			description: 'SSO Browser Authentication'
		},
		{
			value: 'okta',
			description: 'Okta Authentication'
		},
		{
			value: 'snowflake_jwt',
			description: 'Key Pair Authentication'
		}
	];

	let files;
	async function handleUpload() {
		for (const file of files) {
			credentials.private_key = await file.text();
		}
		disableSave = false;
	}
</script>

<AuthSelect {options} bind:selected={credentials.authenticator} />

{#if credentials.authenticator === 'snowflake_jwt'}
	<div class="input-item">
		<label for="private-key"> Private Key File </label>
		{#if credentials.private_key}
			<input
				id="private-key"
				type="file"
				accept="application/x-pem-file"
				bind:files
				on:change={handleUpload}
			/>
		{:else}
			<input
				id="private-key"
				type="file"
				accept="application/x-pem-file"
				bind:files
				on:change={handleUpload}
				required
			/>
		{/if}
	</div>
	<div class="input-item">
		<label for="private-key"> Private Key </label>
		<input
			type="password"
			id="private-key"
			name="private-key"
			value={credentials?.private_key ?? ''}
			disabled
		/>
	</div>
{/if}
<GenericForm opts={opts[credentials.authenticator]} bind:credentials bind:disableSave />

<style>
	div.input-item {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-top: 1.1em;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}

	input {
		box-sizing: border-box;
		border-radius: 4px 4px 4px 4px;
		border: 1px solid var(--grey-300);
		padding: 0.25em 0.25em 0.25em 0.25em;
		margin-left: auto;
		width: 62%;
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
		width: 35%;
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		color: var(--grey-800);
	}
</style>
