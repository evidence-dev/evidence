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
			id: 'ssl',
			label: 'SSL',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'true',
			value: credentials.ssl ?? '',
			additionalInstructions: 'Options are true and false'
		},
		{
			id: 'port',
			label: 'Port',
			type: 'text',
			optional: false,
			override: false,
			placeholder: '443',
			value: credentials.port ?? ''
		},
		{
			id: 'user',
			label: 'User',
			type: 'text',
			optional: false,
			override: false,
			placeholder: 'evidence',
			value: credentials.user ?? ''
		},
		{
			id: 'password',
			label: 'Password',
			type: 'password',
			optional: true,
			override: false,
			placeholder: 'password',
			value: credentials.password ?? ''
		},
		{
			id: 'catalog',
			label: 'Catalog',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'system',
			value: credentials.catalog ?? '',
			additionalInstructions: 'The default catalog to run queries against.'
		},
		{
			id: 'schema',
			label: 'Schema',
			type: 'text',
			optional: true,
			override: false,
			placeholder: 'metadata',
			value: credentials.schema ?? '',
			additionalInstructions: 'The default schema to run queries against.'
		}
	];

	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials bind:disableSave />
