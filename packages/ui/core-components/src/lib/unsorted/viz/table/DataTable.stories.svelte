<script context="module">
	import { Story } from '@storybook/addon-svelte-csf';
	import DataTable from './DataTable.svelte';
	import Column from './Column.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import ButtonGroup from '../../../atoms/inputs/button-group/ButtonGroup.svelte';
	import ButtonGroupItem from '../../../atoms/inputs/button-group/ButtonGroupItem.svelte';
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Datatable',
		component: DataTable
	};
</script>

<script>
	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<Story name="Simple Case">
	{@const data = Query.create(`SELECT * from flights LIMIT 1000`, query)}
	<DataTable {data} />
</Story>

<Story name="With Search">
	{@const data = Query.create(`SELECT * from flights LIMIT 1000`, query)}
	<DataTable {data} title="Flights" search>
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Search (LIMIT 100000)">
	{@const data = Query.create(`SELECT * from flights LIMIT 100000`, query)}
	<DataTable {data} title="Flights" search>
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Groups">
	{@const data = Query.create(
		`SELECT * from flights where regulator in ('Afghanistan', 'Belgium', 'Canada', 'Denmark') limit 50`,
		query
	)}
	<DataTable {data} title="Flights" search groupBy="regulator">
		<Column id="id" title="ID" />
		<Column id="airline" title="Airline" />
		<Column id="departure_airport" title="Departure Airport" />
		<Column id="arrival_airport" title="Arrival Airport" />
	</DataTable>
</Story>

<Story name="With Search (Long Columns)">
	{@const data = Query.create(`SELECT * from blog_posts`, query)}
	<DataTable {data} title="Blog Posts" search />
</Story>

<Story name="Reactive columns">
	{@const data = Query.create(`SELECT '7 days' as cohort, 'stuff' as metadata, 100 as a, 200 as b`, query)}

	<ButtonGroup name="dimension">
		<ButtonGroupItem value="a" valueLabel="a" />
		<ButtonGroupItem value="b" valueLabel="b" />
	</ButtonGroup>
	
	<DataTable data={data}>
		<Column id="cohort" title="Week" />
		<Column id={$inputStore.dimension} />
		<Column id="metadata" title="Metadata" />
	</DataTable>
</Story>

<Story name="Full screen no scroll to top">
	{@const data = Query.create(`SELECT * from flights LIMIT 100`, query)}
	<h1>Top of Page</h1>
	<div
		style="height: 70vh; border: 1px solid black; display: flex; flex-direction: column; justify-content: center; align-items: center;"
	>
		<h2>When clicked on fullscreen should not scroll to top</h2>
	</div>
	<DataTable {data} title="Blog Posts" search />
	<div
		style="height: 30vh; border: 1px solid black; display: flex; flex-direction: column; justify-content: center; align-items: center;"
	>
		<h2>Click Full Screen</h2>
	</div>
	<DataTable {data} title="Blog Posts" search />
	<div
		style="height: 30vh; border: 1px solid black; display: flex; flex-direction: column; justify-content: center; align-items: center;"
	>
		<h2>Bottom of page</h2>
	</div>
</Story>
