<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'Charts/BoxPlot',
		component: BoxPlot,
		argTypes: {
			name: {
				control: 'text'
			},
			min: {
				control: 'text'
			},
			intervalBottom: {
				control: 'text'
			},
			midpoint: {
				control: 'text'
			},
			intervalTop: {
				control: 'text'
			},
			max: {
				control: 'text'
			},
			confidenceInterval: {
				control: 'text'
			},
			emptySet: {
				control: 'select',
				options: ['pass', 'warn', 'error']
			},
			emptyMessage: {
				control: 'text'
			},
			color: {
				control: 'text'
			},
			yFmt: {
				control: 'text'
			},
			xFmt: {
				control: 'text'
			},
			seriesColors: {
				control: 'object'
			},
			swapXY: {
				control: 'boolean',
				options: [true, false]
			},
			xAxisTitle: {
				control: 'text'
			},
			yAxisTitle: {
				control: 'text'
			},
			xGridlines: {
				control: 'boolean',
				options: [true, false]
			},
			yGridlines: {
				control: 'boolean',
				options: [true, false]
			},
			xBaseline: {
				control: 'boolean',
				options: [true, false]
			},
			yBaseline: {
				control: 'boolean',
				options: [true, false]
			},
			xTickMarks: {
				control: 'boolean',
				options: [true, false]
			},
			yTickMarks: {
				control: 'boolean',
				options: [true, false]
			},
			yMin: {
				control: 'number'
			},
			yMax: {
				control: 'number'
			},
			showAllAxisLabels: {
				control: 'boolean',
				options: [true, false]
			},
			title: {
				control: 'text'
			},
			subtitle: {
				control: 'text'
			},
			chartAreaHeight: {
				control: 'number'
			},
			renderer: {
				control: 'select',
				options: ['canvas', 'svg']
			},
			eChartsOptions: {
				control: 'object'
			},
			seriesOptions: {
				control: 'object'
			},
			printEchartsConfig: {
				control: 'boolean',
				options: ['true', 'false']
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import BoxPlot from './BoxPlot.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
	const flightData = Query.create(
		`
SELECT 
    airline, 
    MAX(fare) AS max_fare, 
    MIN(COALESCE(fare, 0)) AS min_fare, 
    MEDIAN(fare) AS median_fare,
	MAX(fare)-1000 AS intervalTop_fare,
	MIN(fare)+1000 AS intervalBottom_fare,
    CASE 
        WHEN airline = 'Qatar Airways' THEN 'red' 
        WHEN airline = 'AirAsia' THEN 'blue' 
        ELSE 'gray' 
    END AS color
FROM flights
WHERE airline IN ('Qatar Airways', 'AirAsia')
GROUP BY airline, color
limit 50`,
		query
	);
</script>

<Story
	name="Base"
	args={{
		name: 'airline',
		intervalBottom: 'min_fare',
		midpoint: 'median_fare',
		intervalTop: 'max_fare',
		yFmt: 'usd0'
	}}
	let:args
>
	<BoxPlot {...args} data={flightData} />
</Story>

<Story
	name="swapXY=true colors"
	args={{
		color: 'color',
		swapXY: 'true',
		name: 'airline',
		intervalBottom: 'min_fare',
		midpoint: 'median_fare',
		intervalTop: 'max_fare',
		yFmt: 'usd0'
	}}
	let:args
>
	<BoxPlot {...args} data={flightData} />
</Story>
<Story
	name="whiskers"
	args={{
		name: 'airline',
		intervalBottom: 'intervalBottom_fare',
		midpoint: 'median_fare',
		intervalTop: 'intervalTop_fare',
		max: 'max_fare',
		min: 'min_fare',
		yFmt: 'usd0'
	}}
	let:args
>
	<BoxPlot {...args} data={flightData} />
</Story>
