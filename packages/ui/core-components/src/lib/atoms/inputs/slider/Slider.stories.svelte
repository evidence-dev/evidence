<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Slider',
		argTypes: {},
		args: {
			title: 'Slider title',
			name: 'Slider name',
			defaultValue: 0,
			min: 0,
			max: 100,
			step: 1
		}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import Slider from './Slider.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	// const data = Query.create(`SELECT *, MAX(fare) as max_fare from flights limit 10`, query);
	const data = Query.create(
		`SELECT
	  CAST(fare AS INT) AS fare,
	  CAST((SELECT MAX(fare) FROM flights) AS INT) AS max_fare,
	  CAST((SELECT MIN(fare) FROM flights) AS INT) AS min_fare
	FROM flights
	LIMIT 100`,
		query
	);
</script>

<Template let:args>
	<Slider {...args} />
</Template>

<Story name="Default" />
<Story
	name="Slider with Steps with default value"
	args={{ name: 'Months', title: 'Months', min: 0, max: 36, step: 12, defaultValue: 12 }}
/>
<Story
	name="Hide max and min"
	args={{ name: 'Months', title: 'Months', min: 0, max: 36, step: 12, showMaxMin: false }}
/>
<Story
	name="medium size"
	args={{
		name: 'Months',
		title: 'Months Medium',
		min: 0,
		max: 36,
		step: 12,
		showMaxMin: true,
		size: 'medium',
		defaultValue: 12
	}}
/>

<Story
	name="large size"
	args={{
		name: 'Months',
		title: 'Months Full',
		min: 0,
		max: 36,
		step: 12,
		showMaxMin: true,
		size: 'full'
	}}
/>

<Story
	name="Negative"
	args={{
		name: 'Months',
		title: 'Negative values',
		min: -1000,
		max: -100,
		defaultValue: -500,
		step: 1,
		showMaxMin: true,
		size: 'full'
	}}
/>
<Story
	name="With USD Format"
	args={{
		name: 'United State Dollar',
		title: 'With USD Format',
		step: 1,
		max: 10000,
		showMaxMin: true,
		fmt: 'usd'
	}}
/>
<Story
	name="With empty Format"
	args={{
		name: 'empty fmt',
		title: 'With empty Format',
		step: 1,
		showMaxMin: true,
		fmt: ''
	}}
/>
<Story
	name="With random numbers Format"
	args={{
		name: 'random numbers fmt',
		title: 'With random numbers Format',
		step: 1,
		showMaxMin: true,
		fmt: '932'
	}}
/>
<Story
	name="With data"
	args={{
		name: 'With data',
		title: 'With data',
		step: 1,
		showMaxMin: true,
		data: data,
		defaultValue: 'max_fare',
		range: 'fare',
		size: 'large',
		fmt: 'usd'
	}}
/>
<Story
	name="With data + maxColumn + minColumn"
	args={{
		name: 'With data',
		title: 'With data',
		step: 5,
		showMaxMin: true,
		data: data,
		defaultValue: 'max_fare',
		range: 'fare',
		maxColumn: 'max_fare',
		minColumn: 'min_fare',
		size: 'large',
		fmt: 'usd'
	}}
/>
<Story
	name="With data incorrect column name"
	args={{
		name: 'With data',
		title: 'With data',
		step: 10,
		showMaxMin: true,
		data: data,
		defaultValue: 'incorrect_column_name',
		maxColumn: 'max_fare',
		size: 'large',
		fmt: 'usd'
	}}
/>
<Story
	name="handle string values"
	args={{
		name: 'String Values',
		defaultValue: '18',
		fmt: 'usd0',
		steps: '2',
		max: '20',
		min: '0'
	}}
/>
<Story
	name="Name Error"
	args={{
		name: undefined,
		defaultValue: '18',
		fmt: 'usd0',
		steps: '2',
		max: '20',
		min: '0'
	}}
/>
<Story
	name="Long Title"
	args={{
		name: 'Slider',
		title: 'A really long title that should be truncated',
		defaultValue: '18',
		fmt: 'usd0',
		steps: '2',
		max: '20',
		min: '0'
	}}
/>
