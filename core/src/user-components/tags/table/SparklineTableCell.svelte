<script lang="ts">
	import LazySparkline from '../sparkline/LazySparkline.svelte';
	import type { SparklineColumnProps } from '../../common/build-sparklines';
	import { getThemeContext } from '../../../theme/theme.context.svelte';

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

	// Parse sparkline data from different formats
	const sparklineData = $derived.by(() => {
		if (typeof value === 'string') {
			// Parse flat string format: "date1,value1,date2,value2,..."
			const parts = value.split(',');
			const tuples: [string | Date, number][] = [];
			for (let i = 0; i < parts.length; i += 2) {
				if (i + 1 < parts.length) {
					const xValue = parts[i].trim();
					const valueNum = Number(parts[i + 1].trim());
					if (!isNaN(valueNum)) {
						// Convert x value similar to regular sparkline logic
						const processedXValue = isNaN(Number(xValue)) ? xValue : new Date(Number(xValue));
						tuples.push([processedXValue, valueNum]);
					}
				}
			}
			return tuples;
		} else if (Array.isArray(value)) {
			// Handle array format: [[date, value], [date, value], ...]
			const result: [string | Date, number][] = [];
			for (const item of value) {
				if (Array.isArray(item) && item.length >= 2) {
					const xValue = item[0];
					const valueNum = Number(item[1]);
					if (!isNaN(valueNum)) {
						// Convert x value similar to regular sparkline logic
						const processedXValue =
							typeof xValue === 'number'
								? new Date(xValue)
								: xValue instanceof Date
									? xValue
									: String(xValue);
						result.push([processedXValue, valueNum]);
					}
				}
			}
			return result;
		}
		return [];
	});

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
