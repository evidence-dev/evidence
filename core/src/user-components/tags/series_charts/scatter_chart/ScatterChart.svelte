<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import ComboChart, { type ComboChartInternalProps } from '../combo_chart/ComboChart.svelte';
	import Scatter from '../scatter/Scatter.svelte';
	import MultiSeries from '../MultiSeries/MultiSeries.svelte';
	import merge from 'lodash/merge';

	const props: UserComponentProps<typeof schema> = $props();

	const transformOptions: ComboChartInternalProps['transformOptions'] = $derived((options) => {
		merge(options, {
			tooltip: {
				trigger: 'item'
			}
		});
	});
</script>

<ComboChart {...props} tagName="scatter_chart" {transformOptions}>
	<MultiSeries {...props}>
		{#snippet seriesSnippet(multiSeriesProps)}
			<!--
				echarts_options={undefined}: scatter_chart's echarts_options is chart-wide (from
				the inherited combo_chart schema); the child <Scatter> also has its own per-series
				echarts_options prop with the same name. Without stripping, {...props} silently
				passes the chart-wide object into the per-series slot.
			-->
			<Scatter
				{...props}
				{...multiSeriesProps}
				y={multiSeriesProps.y ?? ''}
				metric={undefined}
				tagName="scatter_chart"
				echarts_options={undefined}
			/>
		{/snippet}
	</MultiSeries>

	{@render props.children?.()}
</ComboChart>
