<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import ComboChart from '../combo_chart/ComboChart.svelte';
	import Bar from '../bar/Bar.svelte';
	import MultiSeries from '../MultiSeries/MultiSeries.svelte';
	import { getMetricsCatalogContext } from '../../../../metrics/metrics-catalog';
	import { getQueryService } from '../../../../QueryService.context';
	import { applyMetricChartProps } from '../../../../metrics/resolve-metric';

	const props: UserComponentProps<typeof schema> = $props();

	const metricsCatalog = getMetricsCatalogContext();
	const queryService = getQueryService();

	// `metric=` resolves to raw data/x/series/y (see LineChart). Non-metric usage
	// passes through unchanged.
	const chartProps = $derived(applyMetricChartProps(props, metricsCatalog, queryService.dialect));

	// Metric mode relaxes data/x/y to optional in the schema; they're always
	// populated at runtime, so assert that for ComboChart/MultiSeries.
	type ResolvedChartProps = UserComponentProps<typeof schema> & {
		data: string;
		x: string;
		y: string | unknown[];
	};
	const comboProps = $derived(chartProps as ResolvedChartProps);

	const stacked = $derived.by(() => {
		if (comboProps.y2?.length) {
			// Don't stack when we have a secondary axis
			return false;
		}
		return comboProps.stacked;
	});
</script>

<ComboChart {...comboProps} tagName="bar_chart">
	<MultiSeries {...comboProps}>
		{#snippet seriesSnippet(multiSeriesProps)}
			<!--
				echarts_options={undefined}: bar_chart's echarts_options is chart-wide (from
				the inherited combo_chart schema); the child <Bar> also has its own per-series
				echarts_options prop with the same name. Without stripping, {...props} silently
				passes the chart-wide object into the per-series slot.
			-->
			<Bar
				{...comboProps}
				{...multiSeriesProps}
				y={multiSeriesProps.y ?? ''}
				metric={undefined}
				{stacked}
				options={comboProps.bar_options}
				echarts_options={undefined}
			/>
		{/snippet}
	</MultiSeries>

	{@render props.children?.()}
</ComboChart>
