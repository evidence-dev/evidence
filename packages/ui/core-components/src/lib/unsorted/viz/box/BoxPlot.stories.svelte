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
				control: 'boolean'
			},
			xAxisTitle: {
				control: 'text'
			},
			yAxisTitle: {
				control: 'text'
			},
			xGridlines: {
				control: 'boolean'
			},
			yGridlines: {
				control: 'boolean'
			},
			xBaseline: {
				control: 'boolean'
			},
			yBaseline: {
				control: 'boolean'
			},
			xTickMarks: {
				control: 'boolean'
			},
			yTickMarks: {
				control: 'boolean'
			},
			yMin: {
				control: 'number'
			},
			yMax: {
				control: 'number'
			},
			showAllAxisLabels: {
				control: 'boolean'
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
			downloadableData: {
				control: 'boolean',
				options: [true, false]
			},
			downloadableImage: {
				control: 'boolean',
				options: [true, false]
			},
			eChartsOptions: {
				control: 'object'
			},
			seriesOptions: {
				control: 'object'
			},
			printEchartsConfig: {
				control: 'boolean'
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import BoxPlot from './BoxPlot.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

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
    END AS colorColumn
FROM flights
WHERE airline IN ('Qatar Airways', 'AirAsia')
GROUP BY airline, colorColumn
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
	name="swapXY=true"
	args={{
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
	name="colored BoxPlots"
	args={{
		color: 'colorColumn',
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
<Story
	name="empty set"
	args={{
		name: 'airline',
		midpoint: 'median_fare',
		max: 'max_fare',
		min: 'min_fare',
		yFmt: 'usd0',
		emptySet: 'warn',
		emptyMessage: 'No data, data is a empty set'
	}}
	let:args
>
	{@const emptySet = []}
	<BoxPlot {...args} data={emptySet} />
</Story>

<Story
	name="Using color tokens"
	args={{
		name: 'name',
		min: 'min',
		intervalBottom: 'interval_bottom',
		midpoint: 'midpoint',
		intervalTop: 'interval_top',
		max: 'max',
		color: 'color'
	}}
	let:args
>
	{@const data = Query.create(
		`
			select 'a' as name, 1 as min, 2 as interval_bottom, 3 as midpoint, 4 as interval_top, 5 as max, 'positive' as color
			union all
			select 'b' as name, 1 as min, 2 as interval_bottom, 3 as midpoint, 4 as interval_top, 5 as max, 'negative' as color
		`,
		query
	)}
	<BoxPlot {...args} {data} />
</Story>

<Story
	name="Custom Height"
	args={{
		name: 'airline',
		intervalBottom: 'min_fare',
		midpoint: 'median_fare',
		intervalTop: 'max_fare',
		yFmt: 'usd0',
		chartAreaHeight: 500
	}}
	let:args
>
	<BoxPlot {...args} data={flightData} />
</Story>