<script lang="ts">
	import LazySparkline from '../sparkline/LazySparkline.svelte';
	import type { SparklineColumnProps } from '../../common/build-sparklines';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { parseSparklineData } from './sparkline-data';

	type Props = {
		value: unknown;
		sparklineVizConfig: SparklineColumnProps;
	};

	const { value, sparklineVizConfig }: Props = $props();

	const themeContext = getThemeContext();
	// Fall back to the theme's table bar color so spark bars and lines share one
	// data-viz color. Undefined when no token is set, leaving the sparkline's own
	// neutral default untouched.
	const sparklineColor = $derived(
		sparklineVizConfig?.color ?? themeContext.activeTheme.table?.barColor
	);

	const sparklineData = $derived(parseSparklineData(value));

	const hasData = $derived(sparklineData.length > 0);
</script>

{#if hasData}
	<LazySparkline
		chartData={sparklineData}
		type={sparklineVizConfig?.type ?? 'line'}
		color={sparklineColor}
		y_fmt={sparklineVizConfig?.y_fmt}
		x_fmt={sparklineVizConfig?.x_fmt}
		fit_to_data={sparklineVizConfig?.fit_to_data ?? false}
		interactive={false}
		class_name={sparklineVizConfig?.class_name}
		width={50}
		height={15}
		xEChartsType="time"
		loading={false}
	/>
{:else}
	<span class="text-muted-foreground text-xs">-</span>
{/if}
