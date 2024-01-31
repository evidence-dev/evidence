<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import DimensionGrid from './DimensionGrid.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fakerSeries } from '$lib/faker-data-queries.js';

	// From layout.js
	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<Meta
	title="Atoms/inputs/DimensionGrid"
	component={DimensionGrid}
	argTypes={{}}
	args={{ title: 'Dimension Grid', name: 'dimensiongrid' }}
/>

<Template let:args>
	<DimensionGrid {...args} />
</Template>

<Story
	name="Basic Usage"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'count(*)',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="With custom metric"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare) + 308',
		others: true
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="With Grand Total"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare)',
		others: false,
		grandTotal: true
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="With Others, Grand Total"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare)',
		others: true,
		grandTotal: true
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="With Others, Complete List"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare)',
		others: true,
		limit: 20
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Error: Invalid Metric"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'specialsum(fare)',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Error: Null Metric"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare)/0',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Error: String Metric"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: '"whoops!"',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Error: Missing Data"
	let:args
	args={{
		metric: 'sum(fare)/0',
		fmt: 'number',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Error: No String Columns"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'sum(fare)/0',
		fmt: 'number',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>
