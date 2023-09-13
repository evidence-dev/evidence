<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import { genSeries } from '@evidence-dev/component-utilities/tests/getCompletedData.fixture';

	import LineChart from './LineChart.svelte';
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
			maxSieriesLen: 10,
			maxSieriesCount: 1,
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
