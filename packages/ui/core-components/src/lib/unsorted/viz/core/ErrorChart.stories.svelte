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
</script>

<Story name="Default">
	<ErrorChart error={new Error('Test')} title="Some Value" />
</Story>

<Story name="DuckDB Error">
	{@const data = Query.create(`SYNTAX ERROR!`, query)}
	<QueryLoad {data}>
		<ErrorChart slot="error" let:loaded error={loaded.error} title="DuckDB has an Error!" />
	</QueryLoad>
</Story>
