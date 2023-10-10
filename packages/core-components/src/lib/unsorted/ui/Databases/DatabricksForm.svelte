<script>
	export let credentials;
	export let existingCredentials;
	export let disableSave;

	credentials = { ...existingCredentials };

	let opts = [
		{
			id: 'token',
			label: 'Personal Access Token',
			type: 'password',
			optional: false,
			override: false,
			placeholder: 'dapi12345678901234567890123456789012',
			value: credentials.token ?? ''
		},
		{
			id: 'host',
			label: 'Server Hostname',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'dbc-a1b2345c-d6e7.cloud.databricks.com',
			value: credentials.host ?? ''
		},
		{
			id: 'path',
			label: 'HTTP Path',
			type: 'text',
			optional: false,
			override: false,
			placeholder:
				'sql/protocolv1/o/1234567890123456/1234-567890-abcdefgh or /sql/1.0/endpoints/a1b234c5678901d2',
			value: credentials.path ?? ''
		},
		{
			id: 'port',
			label: 'Port',
			type: 'text',
			optional: true,
			override: false,
			placeholder: '443',
			value: credentials.port ?? '443'
		}
	];
	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials bind:disableSave />
