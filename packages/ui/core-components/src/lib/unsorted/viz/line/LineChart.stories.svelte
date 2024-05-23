<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import { genSeries } from '@evidence-dev/component-utilities/tests/getCompletedData.fixture';

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

<Meta
	title="Charts/LineChart"
	,
	component={LineChart}
	argTypes={{
		title: { control: 'text' },
		series: { control: 'text' }
	}}
	args={{
		data: genSeries({
			xHasGaps: false,
			yHasNulls: false,
			seriesAlwaysExists: true,
			maxSeriesLen: 10,
			maxSeriesCount: 2,
			xType: 'number'
		}).data,
		x: 'time',
		y: 'value'
	}}
/>

<Template let:args>
	<LineChart {...args} />
</Template>

<Story name="Default" />

<Story
	name="X Axis Unsorted"
	args={{
		data: [
			{ time: 2, value: 1 },
			{ time: 0, value: 3 },
			{ time: 4, value: 0 },
			{ time: 1, value: 1 },
			{ time: 3, value: 10 }
		]
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
