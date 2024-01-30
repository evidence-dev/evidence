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
		fmt: 'number',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="Huge Numbers"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'count(*)*10000000000',
		fmt: 'number',
		others: false
	}}
>
	<DimensionGrid {...args} />
</Story>

<Story
	name="With Others"
	let:args
	args={{
		data: fakerSeries.airlines.flights.store,
		metric: 'count(*)',
		fmt: 'number',
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
		metric: 'count(*)',
		fmt: 'number',
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
		metric: 'count(*)',
		fmt: 'number',
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
		metric: 'count(*)',
		fmt: 'number',
		others: true,
		limit: 20
	}}
>
	<DimensionGrid {...args} />
</Story>
