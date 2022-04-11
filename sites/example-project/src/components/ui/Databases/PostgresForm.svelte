<script>
	export let credentials;
	export let existingCredentials;

	credentials = { ...existingCredentials };

	let opts = [
		{
			id: 'host',
			label: 'Host',
			type: 'text',
			placeholder: 'database.server.com',
			value: credentials.host ?? ''
		},
		{
			id: 'database',
			label: 'Database',
			type: 'text',
			placeholder: 'my-database-name',
			value: credentials.database ?? ''
		},
		{
			id: 'user',
			label: 'User',
			type: 'text',
			placeholder: 'postgres',
			value: credentials.user ?? ''
		},
		{
			id: 'password',
			label: 'Password',
			type: 'password',
			placeholder: 'password',
			value: credentials.password ?? ''
		},

		{
			id: 'port',
			label: 'Port',
			type: 'text',
			placeholder: '5432',
			value: credentials.port ?? ''
		},

		{
			id: 'ssl',
			label: 'SSL',
			type: 'text',
			optional: true,
			placeholder: 'no-verify',
			value: credentials.ssl ?? '',
			additionalInstructions: 'This is an optional field, when using XYZ this is commonly required.'
		},
		{
			id: 'connectionString',
			label: 'Connection String',
			type: 'text',
			optional: true,
			placeholder: "postgres://ewfeijgrftj:[password]@ec2-57-211-78-100.compute-1.amazonaws.com:5432/kencd6d32m0s51",
			additionalInstructions:
				'This is an optional field, when using XYZ this is commonly required.',
			value: credentials.connectionString ?? ''
		}
	];

	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials />
