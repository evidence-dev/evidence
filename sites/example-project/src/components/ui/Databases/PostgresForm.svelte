<script>
	export let credentials;

	credentials = {
		host: credentials.host,
		database: credentials.database,
		user: credentials.user,
		password: credentials.password,
		port: credentials.port,
		ssl: credentials.ssl,
		connectionString: credentials.connectionString
	};

	let opts = [
		{ id: 'host', label: 'Host', type: 'text', value: credentials.host ?? '' },
		{ id: 'database', label: 'Database', type: 'text', value: credentials.database ?? '' },
		{ id: 'user', label: 'User', type: 'text', value: credentials.user ?? '' },
		{ id: 'password', label: 'Password', type: 'password', value: credentials.password ?? '' },
		{ id: 'port', label: 'Port', type: 'text', value: credentials.port ?? '' },
		{ 
            id: 'ssl', label: 'SSL', type: 'text', optional: true, value: credentials.ssl ?? '',
            additionalInstructions:
				'This is an optional field, when using XYZ this is commonly required.',},
		{
			id: 'connectionString',
			label: 'Connection String',
			type: 'text',
			optional: true,
			additionalInstructions:
				'This is an optional field, when using XYZ this is commonly required.',
			value: credentials.connectionString ?? ''
		}
	];

	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials />
