<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let credentials;
	export let existingCredentials;
	export let disableSave;

	credentials = { ...existingCredentials };

	let opts = [
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
			value: credentials.trustServerCertificate ?? ''
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
	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials bind:disableSave />
