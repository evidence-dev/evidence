<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/AreaChart',
		component: AreaChart,
		argTypes: {
			series: {
				control: 'string'
			},
			sort: {
				control: 'boolean',
				options: [true, false]
			},
			type: {
				control: 'options',
				options: ['stacked', 'stacked100']
			},
			handleMissing: {
				control: 'options',
				options: ['gap', 'connect', 'zero']
			},
			emptySet: {
				control: 'options',
				options: ['pass', 'warn', 'error']
			},
			emptyMessage: {
				control: 'text'
			},
			xFmt: {
				control: 'text'
			},
			yFmt: {
				control: 'text'
			},
			step: {
				control: 'boolean'
			},
			stepPosition: {
				control: 'options',
				options: ['start', 'middle', 'end']
			},
			fillColor: {
				control: 'color'
			},
			lineColor: {
				control: 'color'
			},
			fillOpacity: {
				control: 'number'
			},
			line: {
				control: 'boolean',
				options: [true, false]
			},
			colorPalette: {
				control: 'array'
			},
			seriesColors: {
				control: 'object'
			},
			seriesOrder: {
				control: 'array'
			},
			labels: {
				control: 'boolean'
			},
			labelSize: {
				control: 'number'
			},
			labelPosition: {
				control: 'options',
				options: ['top', 'bottom', 'left', 'right']
			},
			labelColor: {
				control: 'color'
			},
			labelFmt: {
				control: 'text'
			},
			showAllLabels: {
				control: 'boolean',
				options: [true, false]
			},
			yLog: {
				control: 'boolean',
				options: [true, false]
			},
			yLogBase: {
				control: 'number'
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
			xAxisLabels: {
				control: 'boolean',
				options: [true, false]
			},
			yAxisLabels: {
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
			yScale: {
				control: 'boolean',
				options: [true, false]
			},
			title: {
				control: 'text'
			},
			subtitle: {
				control: 'text'
			},
			legend: {
				control: 'boolean',
				options: [true, false]
			},
			chartAreaHeight: {
				control: 'number'
			},
			renderer: {
				control: 'options',
				options: ['canvas', 'svg']
			},
			downloadableData: {
				control: 'boolean',
				options: [true, false]
			},
			downloadableImage: {
				control: 'boolean',
				options: [true, false]
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';

	import AreaChart from './AreaChart.svelte';

	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	const planeData = Query.create(
		`
SELECT f.departure_date, SUM(f.fare) AS total_fare, CONCAT('https://www.google.com/search?q=', ANY_VALUE(f.plane)) as plane_url, f.plane
FROM (
    SELECT DISTINCT plane
    FROM flights
    LIMIT 2
) p
JOIN flights f ON p.plane = f.plane
GROUP BY f.departure_date, f.plane
LIMIT 200`,
		query
	);
</script>

<Story name="Base" args={{ x: 'x', y: 'y', series: 'series' }} let:args>
	{@const data = Query.create(`select * from numeric_series`, query)}
	<AreaChart {data} {...args} />
</Story>

<Story name="With gaps in X" args={{ x: 'x', y: 'y', series: 'series' }} let:args>
	{@const data = Query.create(`select * from numeric_series_xgaps`, query)}
	<AreaChart {data} {...args} />
</Story>

<Story name="With nulls in Y" args={{ x: 'x', y: 'y', series: 'series' }} let:args>
	{@const data = Query.create(`select * from numeric_series_ynulls`, query)}
	<AreaChart {data} {...args} />
</Story>

<Story name="With gaps in series" args={{ x: 'x', y: 'y', series: 'series' }} let:args>
	{@const data = Query.create(`select * from numeric_series_seriesgaps`, query)}
	<AreaChart {data} {...args} />
</Story>

<Story
	name="With Link"
	args={{
		x: 'departure_date',
		y: 'total_fare',
		link: 'plane_url',
		series: 'plane',
		xFmt: 'date',
		yFmt: 'usd0'
	}}
	let:args
>
	<AreaChart data={planeData} {...args} />
</Story>
<Story
	name="With steps, fmt and labels"
	args={{
		x: 'departure_date',
		y: 'total_fare',
		xFmt: 'date',
		yFmt: 'usd0',
		labels: 'true',
		labelFmt: 'usd0',
		step: 'true'
	}}
	let:args
>
	<AreaChart data={planeData} {...args} />
</Story>

<Story
	name="With empty set"
	args={{
		x: 'departure_date',
		y: 'total_fare',
		xFmt: 'date',
		yFmt: 'usd0',
		labels: 'true',
		labelFmt: 'usd0',
		emptySet: 'warn',
		emptyMessage: 'Data is a empty Set'
	}}
	let:args
>
	{@const emptySet = []}
	<AreaChart data={emptySet} {...args} />
</Story>

<Story
	name="Non-downloadable"
	args={{
		x: 'departure_date',
		y: 'total_fare',
		downloadableData: false,
		downloadableImage: false
	}}
	let:args
>
	<AreaChart data={planeData} {...args} />
</Story>

<Story
	name="With seriesOrder"
	args={{ x: 'x', y: 'y', series: 'series', seriesOrder: ['ivory', 'blue', 'violet', 'olive'] }}
	let:args
>
	{@const data = Query.create(`select * from numeric_series`, query)}
	<AreaChart {data} {...args} />
</Story>
<Story
	name="With seriesLabelFmt"
	args={{ x: 'x', y: 'y', series: 'series', seriesOrder: ['ivory', 'blue', 'violet', 'olive'] }}
	let:args
>
	{@const data = Query.create(
		`SELECT 0.1 AS series, 1 AS x, 10 AS y
UNION
SELECT 0.1 AS series, 2 AS x, 20 AS y
UNION
SELECT 0.1 AS series, 3 AS x, 30 AS y
UNION
SELECT 0.5 AS series, 1 AS x, 5 AS y
UNION
SELECT 0.5 AS series, 2 AS x, 15 AS y
UNION
SELECT 0.5 AS series, 3 AS x, 25 AS y`,
		query
	)}
	<AreaChart {data} seriesLabelFmt="pct" {...args} />
</Story>
