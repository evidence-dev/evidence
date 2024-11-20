<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/BubbleChart',
		component: BubbleChart,
		argTypes: {
			series: {
				control: 'string'
			},
			sort: {
				control: 'boolean'
			},
			tooltipTitle: {
				control: 'text'
			},
			emptySet: {
				control: 'select',
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
			sizeFmt: {
				control: 'text'
			},
			shape: {
				control: 'select',
				options: ['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']
			},
			scaleTo: {
				control: 'number'
			},
			opacity: {
				control: 'number'
			},
			fillColor: {
				control: 'color'
			},
			outlineWidth: {
				control: 'number'
			},
			outlineColor: {
				control: 'color'
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
			yLog: {
				control: 'boolean'
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
				control: 'boolean'
			},
			yGridlines: {
				control: 'boolean'
			},
			xAxisLabels: {
				control: 'boolean'
			},
			yAxisLabels: {
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
			title: {
				control: 'text'
			},
			subtitle: {
				control: 'text'
			},
			legend: {
				control: 'boolean'
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
			echartsOptions: {
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

	const data = Query.create(
		'SELECT plane, fare, SUM(fare) as total_sales, SUM(fare) as total_fare FROM flights WHERE plane IN (SELECT DISTINCT plane FROM flights LIMIT 2) GROUP BY plane, fare LIMIT 25',
		query
	);
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import BubbleChart from './BubbleChart.svelte';
</script>

<Story name="Base" args={{ x: 'fare', y: 'total_fare', size: 'total_sales' }} let:args>
	<BubbleChart {data} {...args} />
</Story>

<Story
	name="Series"
	args={{ series: 'plane', x: 'fare', y: 'total_fare', size: 'total_sales' }}
	let:args
>
	<BubbleChart {data} {...args} />
</Story>
<Story name="Sort" args={{ sort: false, x: 'fare', y: 'total_fare', size: 'total_sales' }} let:args>
	<BubbleChart {data} {...args} />
</Story>
<Story
	name="Empty Set"
	args={{
		emptySet: 'warn',
		emptyMessage: 'data set is empty',
		x: 'fare',
		y: 'total_fare',
		size: 'total_sales'
	}}
	let:args
>
	{@const emptyData = []}
	<BubbleChart data={emptyData} {...args} />
</Story>

<Story
	name="With series color and order"
	args={{
		series: 'plane',
		x: 'fare',
		y: 'total_fare',
		size: 'total_sales',
		seriesColors: { 'Embraer 190': 'red', 'Tupolev Tu-204': 'green' },
		seriesOrder: ['Tupolev Tu-204', 'Embraer 190']
	}}
	let:args
>
	<BubbleChart {data} {...args} />
</Story>

<Story
	name="With seriesLabelFmt"
	args={{
		series: 'series',
		x: 'x',
		y: 'y',
		size: 'size'
	}}
	let:args
>
	{@const data = Query.create(
		`SELECT 0.1 AS series, 1 AS x, 10 AS y, 100 AS size
UNION
SELECT 0.1 AS series, 2 AS x, 20 AS y, 200 AS size
UNION
SELECT 0.1 AS series, 3 AS x, 30 AS y, 300 AS size
UNION
SELECT 0.5 AS series, 1 AS x, 5 AS y, 50 AS size
UNION
SELECT 0.5 AS series, 2 AS x, 15 AS y, 150 AS size
UNION
SELECT 0.5 AS series, 3 AS x, 25 AS y, 250 AS size`,
		query
	)}
	<BubbleChart seriesLabelFmt="pct" {data} {...args} />
</Story>
