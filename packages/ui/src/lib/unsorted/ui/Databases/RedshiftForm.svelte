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
			placeholder: 'redshift-cluster-1.abcd12de3fgh.us-east-1.redshift.amazonaws.com',
			value: credentials.host ?? ''
		},
		{
			id: 'database',
			label: 'Database',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'dev',
			value: credentials.database ?? ''
		},
		{
			id: 'user',
			label: 'User',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'awsuser',
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
			placeholder: '5439',
			value: credentials.port ?? ''
		},

		{
			id: 'ssl',
			label: 'SSL',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'no-verify',
			value: credentials.ssl ?? '',
			additionalInstructions: 'Options are true, false, no-verify.'
		},
		{
			id: 'connectionString',
			label: 'Connection String',
			type: 'text',
			optional: true,
			override: true,
			placeholder: 'postgres://[username]:[password]@[host]:[port]/[database]',
			additionalInstructions:
				'If your database host provides a connection string, you can use that here in place of the user/password fields above.',
			value: credentials.connectionString ?? ''
		}
	];

	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials bind:disableSave />
