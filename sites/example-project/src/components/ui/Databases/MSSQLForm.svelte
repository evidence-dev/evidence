<script>
	import AuthSelect from './AuthSelect.svelte';
	import GenericForm from './GenericForm.svelte';
	export let credentials;
	export let existingCredentials;
	export let disableSave;

	credentials = { ...existingCredentials };
	credentials.authentication_method = credentials.authentication_method ?? 'sql-auth';

	const sql_auth = [
		{
			id: 'host',
			label: 'Host',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'database.server.com',
			value: credentials.host ?? ''
		},
		{
			id: 'database',
			label: 'Database',
			optional: false,
			override: false,
			placeholder: 'my-database-name',
			type: 'text',
			value: credentials.database ?? ''
		},
		{
			id: 'user',
			label: 'User',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'username',
			value: credentials.user ?? ''
		},
		{
			id: 'password',
			label: 'Password',
			type: 'password',
			optional: false,
			override: false,
			placeholder: 'password',
			value: credentials.password ?? ''
		},
		{
			id: 'port',
			label: 'Port',
			type: 'text',
			optional: true,
			override: false,
			placeholder: '1433',
			value: credentials.port ?? ''
		},
		{
			id: 'trust_server_certificate',
			label: 'Trust Server Certificate',
			type: 'text',
			additionalInstructions: 'Should be true for local dev / self-signed certificates',
			optional: true,
			override: false,
			placeholder: 'false',
			value: credentials.trust_server_certificate ?? ''
		},
		{
			id: 'encrypt',
			label: 'Encrypt',
			type: 'text',
			additionalInstructions: 'Should be true when using Azure',
			optional: true,
			override: false,
			placeholder: 'true',
			value: credentials.encrypt ?? ''
		}
	];

	const azure_auth = {
		'azure-active-directory-default': [
			{
				id: 'client_id',
				label: 'Client ID',
				type: 'text',
				optional: true,
				override: false,
				placeholder: '7d83aa3c-8c0d-4265-9169-a77e5b9',
				value: credentials.client_id ?? ''
			}
		],
		'azure-active-directory-password': [
			{
				id: 'username',
				label: 'Username',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'username',
				value: credentials.username ?? ''
			},
			{
				id: 'password',
				label: 'Password',
				type: 'password',
				optional: false,
				override: false,
				placeholder: 'password',
				value: credentials.password ?? ''
			},
			{
				id: 'client_id',
				label: 'Client ID',
				type: 'text',
				optional: false,
				override: false,
				placeholder: '7d83aa3c-8c0d-4265-9169-a77e5b9',
				value: credentials.client_id ?? ''
			},
			{
				id: 'tenant_id',
				label: 'Tenant ID',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'common',
				value: credentials.tenant_id ?? ''
			}
		],
		'azure-active-directory-access-token': [
			{
				id: 'token',
				label: 'Token',
				type: 'text',
				optional: false,
				override: false,
				placeholder: '8f94bb4d-9d1e-5376-9279-b88f6c9',
				value: credentials.token ?? ''
			}
		],
		'azure-active-directory-msi-vm': [
			{
				id: 'client_id',
				label: 'Client ID',
				type: 'text',
				optional: false,
				override: false,
				placeholder: '7d83aa3c-8c0d-4265-9169-a77e5b9',
				value: credentials.client_id ?? ''
			},
			{
				id: 'msi_endpoint',
				label: 'MSI Endpoint',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'http://169.254.169.254/metadata/identity/oauth2/token',
				value: credentials.msi_endpoint ?? ''
			}
		],
		'azure-active-directory-msi-app-service': [
			{
				id: 'client_id',
				label: 'Client ID',
				type: 'text',
				optional: false,
				override: false,
				placeholder: '7d83aa3c-8c0d-4265-9169-a77e5b9',
				value: credentials.client_id ?? ''
			},
			{
				id: 'msi_endpoint',
				label: 'MSI Endpoint',
				type: 'text',
				optional: false,
				override: false,
				placeholder: 'http://169.254.169.254/metadata/identity/oauth2/token',
				value: credentials.msi_endpoint ?? ''
			},
			{
				id: 'msi_secret',
				label: 'MSI Secret',
				type: 'password',
				optional: false,
				override: false,
				placeholder: 'secret',
				value: credentials.msi_secret ?? ''
			}
		],
		'azure-active-directory-service-principal-secret': [
			{
				id: 'client_id',
				label: 'Client ID',
				type: 'text',
				optional: false,
				override: false,
				placeholder: '7d83aa3c-8c0d-4265-9169-a77e5b9',
				value: credentials.client_id ?? ''
			},
			{
				id: 'client_secret',
				label: 'Client Secret',
				type: 'password',
				optional: false,
				override: false,
				placeholder: '6c72992b-7bfc-3154-8058-066d4a8',
				value: credentials.client_secret ?? ''
			},
			{
				id: 'tenant_id',
				label: 'Tenant ID',
				type: 'text',
				optional: true,
				override: false,
				placeholder: 'common',
				value: credentials.tenant_id ?? ''
			}
		]
	};

	// use the azure active directory values as keys for the above
	const auth_options = [
		{ value: 'sql-auth', description: 'SQL Connection' },
		{ value: 'windows', description: 'Windows Authentication' },
		{ value: 'azure-active-directory-default', description: 'Azure Active Directory - Default' },
		{ value: 'azure-active-directory-password', description: 'Azure Active Directory - Password' },
		{
			value: 'azure-active-directory-access-token',
			description: 'Azure Active Directory - Access Token'
		},
		{ value: 'azure-active-directory-msi-vm', description: 'Azure Active Directory - MSI VM' },
		{
			value: 'azure-active-directory-msi-app-service',
			description: 'Azure Active Directory - MSI App Service'
		},
		{
			value: 'azure-active-directory-service-principal-secret',
			description: 'Azure Active Directory - Service Principal Secret'
		}
	];
</script>

<AuthSelect options={auth_options} bind:selected={credentials.authentication_method} />

{#if credentials.authentication_method.startsWith('azure-active-directory')}
	<GenericForm
		opts={azure_auth[credentials.authentication_method]}
		bind:credentials
		bind:disableSave
	/>
{:else if credentials.authentication_method === 'windows'}
	<p class="mt-4">
		When using Windows Authentication, the SQL Server connector automatically detects credentials
		from your operating system. See the <a
			href="https://learn.microsoft.com/en-us/sql/relational-databases/security/choose-an-authentication-mode?view=sql-server-ver16#connecting-through-windows-authentication"
			target="_blank"
			rel="noreferrer">Microsoft documentation</a
		> for more details.
	</p>
{:else}
	<GenericForm opts={sql_auth} bind:credentials bind:disableSave />
{/if}
