<script context="module">
	import DimensionGrid from './DimensionGrid.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		component: DimensionGrid,
		argTypes: [],
		title: 'Charts/DimensionGrid'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';

	import { fakerSeries } from '$lib/faker-data-queries.js';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { userEvent, within } from '@storybook/test';

	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);

	const data = Query.create('select * from flights limit 500', query);

	const nullComboData = Query.create('select * from flights limit 1000', query);

	const delay = (ms) => {
		return new Promise((resolve) => setTimeout(resolve, ms));
	};
</script>

<Story name="Basic Usage">
	<DimensionGrid {data} name="BasicUsage" />
</Story>

<Story name="Named as an Input">
	<DimensionGrid name="dimensiongrid" data={fakerSeries.airlines.flights.store} />
</Story>

<Story name="Labelled Metric">
	<DimensionGrid data={fakerSeries.airlines.flights.store} metricLabel="Flights" />
</Story>

<Story name="Labelled Metric with Long Label">
	<DimensionGrid
		data={fakerSeries.airlines.flights.store}
		metricLabel="A very long metric label that I cooked up for this purpose"
	/>
</Story>

<Story name="Limit 15">
	<DimensionGrid limit="15" data={fakerSeries.airlines.flights.store} />
</Story>

<Story name="Limit 0">
	<DimensionGrid limit="0" data={fakerSeries.airlines.flights.store} />
</Story>

<Story name="Custom metric">
	<DimensionGrid metric="sum(fare) + 308" data={fakerSeries.airlines.flights.store} />
</Story>

<Story name="Negative Values">
	<DimensionGrid metric="count(*) -5000" data={fakerSeries.airlines.flights.store} />
</Story>

<Story name="Null Metric Values">
	<DimensionGrid metric="sum(fare)/0" data={fakerSeries.airlines.flights.store} />
</Story>

<Story name="Null Dimension Values">
	<DimensionGrid
		data={Query.create(
			"SELECT case when fare > 500 then 'Big Fare!!' else null end as nullable_string_column, * FROM series_demo_source.flights",
			query,
			{ disableCache: true }
		)}
	/>
</Story>

<Story name="Invalid Metric">
	<DimensionGrid metric="specialsum(fare)" data={fakerSeries.airlines.flights.store} />
</Story>

<Story name="No Data Prop">
	<DimensionGrid />
</Story>

<Story name="String Data Prop">
	<DimensionGrid data="my_query" />
</Story>

<Story name="Empty Data">
	<DimensionGrid
		data={Query.create('SELECT * FROM series_demo_source.flights limit 0', query, {
			disableCache: true
		})}
	/>
</Story>

<Story name="SQL Error in Data">
	<DimensionGrid
		data={Query.create('SELECT does_not_exist FROM series_demo_source.flights limit 0', query, {
			disableCache: true
		})}
	/>
</Story>

<Story name="No String Columns">
	<DimensionGrid
		data={Query.create('SELECT fare FROM series_demo_source.flights limit 10', query, {
			disableCache: true
		})}
	/>
</Story>

<Story name="Allow multiple dimensions within same column">
	<DimensionGrid data={fakerSeries.airlines.flights.store} name="multipleSelect" multiple />
</Story>

<Story name="string query with spaces">
	<DimensionGrid
		data={Query.create(
			`SELECT "fare" as "fare price", "airline" as "Airline Name" from flights limit 10`,
			query,
			{
				disableCache: true
			}
		)}
	/>
</Story>

<Story
	name="Filtering in one column"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const row = await screen.findByText('China Eastern Airlines');

		await userEvent.click(row);
	}}
>
	<DimensionGrid {data} />
</Story>

<Story
	name="Filtering in multiple columns"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('China Eastern Airlines');
		await userEvent.click(airline);

		const plane = await screen.findByText('Boeing 787');
		await userEvent.click(plane);
	}}
>
	<DimensionGrid {data} />
</Story>
<Story
	name="Selecting Multiple Values in single column"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('China Eastern Airlines');
		await userEvent.click(airline);
		const airline2 = await screen.findByText('Japan Airlines');
		await userEvent.click(airline2);
	}}
>
	<DimensionGrid {data} multiple />
</Story>
<Story
	name="Selecting Multiple Values in Multiple Columns"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('China Eastern Airlines');
		await userEvent.click(airline);

		const plane = await screen.findByText('Boeing 757');
		await userEvent.click(plane);

		await delay(750);

		const airline2 = await screen.findByText('Japan Airlines');
		await userEvent.click(airline2);

		const plane2 = await screen.findByText('Boeing 767');
		await userEvent.click(plane2);
	}}
>
	<DimensionGrid {data} multiple />
</Story>
<Story
	name="Deselecting Multiple Values in Multiple Columns"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('China Eastern Airlines');
		await userEvent.click(airline);
		await delay(750);
		await userEvent.click(airline);

		const plane = await screen.findByText('Boeing 757');
		await userEvent.click(plane);
		await delay(750);
		await userEvent.click(plane);
	}}
>
	<DimensionGrid {data} multiple />
</Story>

<Story
	name="Heights adjust with many options selected"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const airline = await screen.findByText('China Eastern Airlines');
		await userEvent.click(airline);

		await delay(500);

		const airline2 = await screen.findByText('Japan Airlines');
		await userEvent.click(airline2);

		await delay(500);

		const plane = await screen.findByText('Boeing 757');
		await userEvent.click(plane);

		await delay(500);

		const plane2 = await screen.findByText('Boeing 767');
		await userEvent.click(plane2);

		await delay(500);

		const airline3 = await screen.findByText('Egyptair');
		await userEvent.click(airline3);

		await delay(500);

		const airline4 = await screen.findByText('American Airlines');
		await userEvent.click(airline4);

		await delay(500);

		const plane3 = await screen.findByText('Airbus A330-200');
		await userEvent.click(plane3);
	}}
>
	<DimensionGrid {data} multiple />
</Story>

<Story name="Null Metric Values Multiple">
	<DimensionGrid
		data={Query.create(
			"SELECT case when fare > 500 then 'Big Fare!!' else null end as nullable_string_column, * FROM series_demo_source.flights",
			query,
			{ disableCache: true }
		)}
	/>
</Story>

<Story
	name="Null Row Column Combination"
	play={async ({ canvasElement }) => {
		await data.fetch();
		const screen = within(canvasElement);

		const plane = await screen.findByText('Boeing 717');
		await userEvent.click(plane);

		await delay(500);

		const plane2 = await screen.findByText('Antonov An-12');
		await userEvent.click(plane2);

		await delay(500);

		const airline = await screen.findByText('Azur Air');
		await userEvent.click(airline);
	}}
>
	<DimensionGrid data={nullComboData} multiple />
</Story>
