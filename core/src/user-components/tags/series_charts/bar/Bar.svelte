<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import type { SeriesInternalProps } from '../combo_chart/series/Series.svelte';
	import { getStackedYMinMax } from '../../../getStackedYMinMax';
	import Series from '../combo_chart/series/Series.svelte';
	import merge from 'lodash/merge';
	import type { BarSeriesOption } from 'echarts';

	type InternalProps = {
		stacked?: boolean | string; // Can be overridden by bar_chart (validated to true/false/"100%" by schema)
		yLabel?: string; // Metric-mode legend label override; forwarded to <Series>.
	};

	const props: UserComponentProps<typeof schema> & InternalProps = $props();
	const stack_id = $derived(props.stack_id);
	const color = $derived(props.options?.color);
	const opacity = $derived(props.options?.opacity);

	// Check if we're in percentage stacking mode
	const isPercentageStack = $derived(props.stacked === '100%');

	// Determine the stack identifier:
	// 1. If stack_id prop is provided, use it
	// 2. If stacked prop is true or "100%" (from schema default or bar_chart override), use default 'stack1'
	// 3. Otherwise, no stacking
	const stackIdentifier = $derived(stack_id ?? (props.stacked ? 'stack1' : undefined));

	const transformSeriesOptions: SeriesInternalProps['transformSeriesOptions'] = $derived(
		(options) => {
			merge(options, <BarSeriesOption>{
				color,
				stack: stackIdentifier,
				itemStyle: {
					opacity
				}
			});
			if (props.echarts_options) merge(options, props.echarts_options);
		}
	);

	// For percentage stacking, y-axis should be fixed at 0-1 (SSF % format displays as 0%-100%)
	// For regular stacking, use getStackedYMinMax to calculate proper bounds
	// For no stacking, let the default behavior handle it
	const getYMinMax: SeriesInternalProps['getYMinMax'] = $derived(
		isPercentageStack ? () => ({ min: 0, max: 1 }) : stackIdentifier ? getStackedYMinMax : undefined
	);
</script>

<Series
	{...props}
	type="bar"
	{getYMinMax}
	{transformSeriesOptions}
	percentageStack={isPercentageStack}
	isStacked={!!stackIdentifier}
	stackId={stackIdentifier}
/>
