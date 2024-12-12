<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Utils/ErrorChart',
		component: ErrorChart,
		argTypes: {}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import ErrorChart from './ErrorChart.svelte';

	import QueryLoad from '../../../atoms/query-load/QueryLoad.svelte';

	const lorem =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
</script>

<Story name="Default">
	<ErrorChart error={new Error('Test')} title="Some Value" />
</Story>

<Story name="Very Long Line">
	<ErrorChart error={new Error(lorem)} title="Some Value" />
</Story>

<Story name="DuckDB Error">
	{@const data = Query.create(`SYNTAX ERROR!`, query)}
	<QueryLoad {data}>
		<ErrorChart slot="error" let:loaded error={loaded.error} title="DuckDB has an Error!" />
	</QueryLoad>
</Story>
