<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import Series, { type SeriesInternalProps } from '../combo_chart/series/Series.svelte';
	import merge from 'lodash/merge';
	import type { LineSeriesOption } from 'echarts';

	// `yLabel` is an internal metric-mode label override; forwarded to <Series>.
	const props: UserComponentProps<typeof schema> & { yLabel?: string } = $props();

	const color = $derived(props.options?.color);
	const width = $derived(props.options?.width);
	const type = $derived(props.options?.type);
	const opacity = $derived(props.options?.opacity);
	const markerShape = $derived(props.options?.markers?.shape);
	const markerSize = $derived(props.options?.markers?.size);
	const step = $derived(props.options?.step);
	const smooth = $derived(props.options?.smooth);

	// If user explicitly configured markers, make them visible (override default opacity: 0)
	const hasExplicitMarkers = $derived(Boolean(props.options?.markers));

	const transformSeriesOptions: SeriesInternalProps['transformSeriesOptions'] = $derived(
		(options) => {
			merge(options, <LineSeriesOption>{
				color,
				step,
				smooth,
				lineStyle: {
					color,
					width,
					type,
					opacity
				},
				itemStyle: {
					color,
					// If markers are explicitly configured, show them (opacity 1)
					// Otherwise use provided opacity or leave as default (hidden)
					opacity: hasExplicitMarkers ? (opacity ?? 1) : opacity
				},
				symbol: markerShape,
				symbolSize: markerSize
			});
			// Per-series echarts_options applied last so author overrides win
			// over the structured `options` props above.
			if (props.echarts_options) merge(options, props.echarts_options);
		}
	);
</script>

<Series {...props} type="line" {transformSeriesOptions} />
