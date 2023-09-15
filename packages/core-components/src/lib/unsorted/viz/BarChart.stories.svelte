<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import { genSeries } from '@evidence-dev/component-utilities/tests/getCompletedData.fixture';
	import { MissingYCase } from '@evidence-dev/component-utilities/tests/getCompletedData.fixture.manual';

	import BarChart from './BarChart.svelte';

	const defaultGenSeriesOpts =
		/** @type {import("@evidence-dev/component-utilities/tests/getCompletedData.fixture").GenSeriesOpts} */ {
			xHasGaps: false,
			yHasNulls: false,
			seriesAlwaysExists: true,
			maxSeriesLen: 10,
			minSeriesCount: 2,
			maxSeriesCount: 5,
			xType: 'category',
			keys: {
				x: 'category',
				y: 'value',
				series: 'series'
			}
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
	name="Crowded (Explicit X Type)"
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

<!-- 
	This story doesn't work because our series mocking currently doesn't include evidenceColumnTypes
	<Story
	name="Crowded (Implicit X Type)"
	args={{
		data: genSeries({
			...defaultGenSeriesOpts,
			minSeriesLen: 15,
			maxSeriesLen: 15,
			minSeriesCount: 4
		}).data
	}}
/> 
-->

<Story
	name="MultiSeries with Missing Entries"
	args={{
		type: 'stacked',
		data: MissingYCase.data,
		...MissingYCase.keys
	}}
/>>
