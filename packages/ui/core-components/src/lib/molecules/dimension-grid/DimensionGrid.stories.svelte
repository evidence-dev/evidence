<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import DimensionGrid from './DimensionGrid.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fakerSeries } from '$lib/faker-data-queries.js';
	import { QueryStore } from '@evidence-dev/query-store';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	// From layout.js
	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<Meta title="Charts/DimensionGrid" component={DimensionGrid} argTypes={{}} />

<Template let:args>
	<DimensionGrid {...args} />
</Template>

<Story
	name="Basic Usage"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Named as an Input"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		name: 'dimensiongrid'
	}}
>
	<div class="my-2 bg-gray-50 border-2 border-dashed font-mono rounded p-2 text-xs">
		<dt class=" font-semibold">$inputs.dimensiongrid</dt>
		<dd>{$inputStore.dimensiongrid}</dd>
	</div>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Labelled Metric"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metricLabel: 'Flights'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Labelled Metric with Long Label"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metricLabel: 'A very long metric label that I cooked up for this purpose'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Limit 15"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		limit: '15'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Limit 0"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		limit: 0
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Custom metric"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare) + 308'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Negative Values"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'count(*) -5000'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Null Metric Values"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare)/0'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Null Dimension Values"
	let:args
	args={{
		data: new QueryStore(
			"SELECT case when fare > 500 then 'Big Fare!!' else null end as nullable_string_column, * FROM series_demo_source.flights",
			query
		)
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Invalid Metric"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'specialsum(fare)'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story name="No Data Prop" let:args args={{}}>
	<DimensionGrid {...args} />
</Story>

<Story
	name="String Data Prop"
	let:args
	args={{
		data: 'my_query'
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Empty Data"
	let:args
	args={{
		data: new QueryStore('SELECT * FROM series_demo_source.flights limit 0', query)
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="SQL Error in Data"
	let:args
	args={{
		data: new QueryStore('SELECT does_not_exist FROM series_demo_source.flights limit 0', query)
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="No String Columns"
	let:args
	args={{
		data: new QueryStore('SELECT fare FROM series_demo_source.flights', query)
	}}
>
	<DimensionGrid {...args} />
</Story>
