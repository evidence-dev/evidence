<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import { genSeries } from '@evidence-dev/component-utilities/tests/getCompletedData.fixture';

	import BarChart from './BarChart.svelte';

	const defaultGenSeriesOpts = {
		xHasGaps: false,
		yHasNulls: false,
		seriesAlwaysExists: true,
		maxSeriesLen: 10,
		minSeriesCount: 2,
		maxSeriesCount: 5,
		xType: 'categories'
	};
</script>

<Meta
	title="Charts/BarChart"
	component={BarChart}
	argTypes={{
		title: { control: 'text' },
		series: { control: 'text' }
	}}
	args={{
		data: genSeries(defaultGenSeriesOpts).data,
		x: 'category',
		y: 'value',
		series: 'series',
		type: 'grouped'
	}}
/>

<Template let:args>
	<BarChart {...args} />
</Template>

<Story name="Base" />

<Story
	name="Crowded"
	args={{
		xType: 'category',
		data: genSeries({
			...defaultGenSeriesOpts,
			minSeriesLen: 15,
			maxSeriesLen: 15,
			minSeriesCount: 4
		}).data
	}}
/>
