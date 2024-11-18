<script context="module">
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/LineChart',
		component: LineChart,
		argTypes: {
			title: { control: 'text' },
			series: { control: 'text' },
			downloadableData: {
				control: 'boolean',
				options: [true, false]
			},
			downloadableImage: {
				control: 'boolean',
				options: [true, false]
			},
			seriesOrder: {
				control: 'array'
			}
		},
		args: {
			data: Query.create('select * from series_demo_source.numeric_series', query)
		}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';

	import LineChart from './LineChart.svelte';
	import Chart from '../core/Chart.svelte';
	import Line from './Line.svelte';

	let brokenData = [
		{
			x: null,
			y: null,
			series: 'missing'
		}
	];

	const fixBrokenData = () => {
		brokenData = [...brokenData, { x: 5, y: 5, series: 'appears' }];
	};

	const rebreakData = () => {
		brokenData = brokenData.filter((d) => d.x === null);
	};
</script>

<Template let:args>
	<LineChart {...args} />
</Template>

<Story name="Default" args={{ x: 'x', y: 'y', series: 'series' }} />

<Story
	name="X Axis Unsorted"
	args={{
		data: [
			{ time: 2, value: 1 },
			{ time: 0, value: 3 },
			{ time: 4, value: 0 },
			{ time: 1, value: 1 },
			{ time: 3, value: 10 }
		],
		x: 'time',
		y: 'value'
	}}
/>

<Story name="Multiple Series, X null all instances of one">
	<LineChart x="x" y="y" series="series" data={brokenData} legend sort={false} />
	<div class="flex gap-2">
		<button on:click={fixBrokenData}>Fix It</button>
		<button on:click={rebreakData}>Rebreak it</button>
	</div>

	Chart!
	<Chart data={brokenData} y="y" series="series">
		<Line />
		<Line />
	</Chart>

	<LineChart x="x" y="y" series="series" data={[]} legend sort={false} />
</Story>

<Story
	name="With seriesOrder and seriesColors"
	args={{
		x: 'x',
		y: 'y',
		series: 'series',
		seriesOrder: ['ivory', 'blue', 'violet', 'olive'],
		seriesColors: { ivory: 'primary', blue: 'secondary', violet: 'accent', olive: 'negative' }
	}}
/>
