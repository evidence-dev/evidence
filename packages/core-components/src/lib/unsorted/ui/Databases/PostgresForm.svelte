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
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'my-database-name',
			value: credentials.database ?? ''
		},
		{
			id: 'user',
			label: 'User',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'postgres',
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
			optional: false,
			override: false,
			placeholder: '5432',
			value: credentials.port ?? ''
		},
		{
			id: 'schema',
			label: 'Schema',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'public',
			value: credentials.schema ?? '',
			additionalInstructions: 'The default schema to run queries against.'
		},
		{
			id: 'ssl',
			label: 'SSL',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'no-verify',
			value: credentials.ssl ?? '',
			additionalInstructions:
				'Options are true, false, no-verify. When using Heroku this is commonly required.'
		},
		{
			id: 'connectionString',
			label: 'Connection String',
			type: 'text',
			optional: true,
			override: true,
			placeholder:
				'postgres://ewfeijgrftj:[password]@ec2-57-211-78-100.compute-1.amazonaws.com:5432/kencd6d32m0s51',
			additionalInstructions:
				'If your database host provides a connection string, you can use that here in place of the user/password fields above.',
			value: credentials.connectionString ?? ''
		}
	];

	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials bind:disableSave />
