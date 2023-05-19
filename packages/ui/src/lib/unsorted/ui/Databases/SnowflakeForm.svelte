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
		}
	];

	import GenericForm from './GenericForm.svelte';
</script>

<GenericForm {opts} bind:credentials bind:disableSave />
