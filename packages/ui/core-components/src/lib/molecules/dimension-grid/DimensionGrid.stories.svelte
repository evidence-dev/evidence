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
</script>

<Story name="Basic Usage">
	<DimensionGrid data={fakerSeries.airlines.flights.store} name="BasicUsage" />
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
		data={Query.create('SELECT fare FROM series_demo_source.flights', query, {
			disableCache: true
		})}
	/>
</Story>
