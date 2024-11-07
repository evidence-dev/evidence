<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/ScatterPlot',
		component: ScatterPlot,
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
			shape: {
				control: 'select',
				options: ['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']
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
	import ScatterPlot from './ScatterPlot.svelte';
</script>

<Story name="Base" args={{ x: 'fare', y: 'total_fare', size: 'total_sales' }} let:args>
	<ScatterPlot {data} {...args} />
</Story>

<Story
	name="Series"
	args={{ series: 'plane', x: 'fare', y: 'total_fare', size: 'total_sales' }}
	let:args
>
	<ScatterPlot {data} {...args} />
</Story>
<Story name="Sort" args={{ sort: false, x: 'fare', y: 'total_fare', size: 'total_sales' }} let:args>
	<ScatterPlot {data} {...args} />
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
	<ScatterPlot data={emptyData} {...args} />
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
	<ScatterPlot {data} {...args} />
</Story>
