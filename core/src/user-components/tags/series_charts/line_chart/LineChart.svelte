<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import ComboChart from '../combo_chart/ComboChart.svelte';
	import Line from '../line/Line.svelte';
	import MultiSeries from '../MultiSeries/MultiSeries.svelte';
	import { getMetricsCatalogContext } from '../../../../metrics/metrics-catalog';
	import { getQueryService } from '../../../../QueryService.context';
	import { applyMetricChartProps } from '../../../../metrics/resolve-metric';

	const props: UserComponentProps<typeof schema> = $props();

	const metricsCatalog = getMetricsCatalogContext();
	const queryService = getQueryService();

	// `metric="revenue"` resolves to the raw data/x/series/y a line chart already
	// understands (metric supplies data + y; x defaults to the view's time column,
	// grain to the view's default; named dimensions resolve for x/series). Keeps
	// the whole chart pipeline (ComboChart → MultiSeries → SeriesModel) untouched.
	const chartProps = $derived(applyMetricChartProps(props, metricsCatalog, queryService.dialect));

	// `metric` mode makes data/x/y optional in the schema (so `metric="revenue"`
	// alone validates), but ComboChart/MultiSeries require them. `chartProps`
	// always populates them at runtime, so assert that for the type checker.
	type ResolvedChartProps = UserComponentProps<typeof schema> & {
		data: string;
		x: string;
		y: string | unknown[];
	};
	const comboProps = $derived(chartProps as ResolvedChartProps);
</script>

<ComboChart {...comboProps} tagName="line_chart">
	<MultiSeries {...comboProps}>
		{#snippet seriesSnippet(multiSeriesProps)}
			<Line
				{...chartProps}
				{...multiSeriesProps}
				y={multiSeriesProps.y ?? ''}
				metric={undefined}
				options={chartProps.line_options}
				echarts_options={undefined}
			/>
		{/snippet}
	</MultiSeries>

	{@render props.children?.()}
</ComboChart>
