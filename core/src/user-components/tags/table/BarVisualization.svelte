<script lang="ts">
	import { cn } from '../../../shadcn/utils';
	import type { ColumnMetaItem, PivotRow } from '../../common/pivot-utils';

	interface Props {
		value: number;
		columnMeta: ColumnMetaItem;
		row: PivotRow;
		range: { min: number; max: number };
	}

	const { value, columnMeta: tableMeasure, row, range }: Props = $props();

	// Extract scale column and value
	const scaleColumn = $derived(tableMeasure.key);
	const scaleValue = $derived(Number(row[scaleColumn]));

	// Use pre-calculated range
	const min = $derived(range.min);
	const max = $derived(range.max);

	// Calculate positioning and scaling values
	const fitToData = $derived(tableMeasure?.bar_options?.fit_to_data ?? false);
	const adjustedMin = $derived(fitToData ? min : Math.min(min, 0));
	const adjustedMax = $derived(fitToData ? max : Math.max(max, 0));
	const rangeSize = $derived(adjustedMax - adjustedMin);
	const zeroPosition = $derived(rangeSize > 0 ? (0 - adjustedMin) / rangeSize : 0);
	const zeroPercent = $derived(Math.max(0, Math.min(100, zeroPosition * 100)));
	const isNegative = $derived(scaleValue < 0);
	const isZero = $derived(scaleValue === 0);
	const barPercent = $derived(
		fitToData
			? (Math.abs(scaleValue - adjustedMin) / rangeSize) * 100
			: (Math.abs(scaleValue) / rangeSize) * 100
	);

	// Color logic for subtotals - use positive/negative colors like regular cells
	const subtotalLevels = {
		positive: [
			'bg-(--theme-table-bar)',
			'bg-(--theme-table-bar)',
			'bg-(--theme-table-bar)'
		],
		negative: ['bg-(--theme-negative)', 'bg-(--theme-negative)', 'bg-(--theme-negative)']
	};

	// Calculate bar positioning and styling
	const barStyle = $derived.by(() => {
		let positioning = '';
		if (fitToData) {
			// When fitting to data, use the full width proportionally
			const valuePosition = ((scaleValue - adjustedMin) / rangeSize) * 100;
			positioning = `left: 0%; width: ${valuePosition}%; max-width: calc(100% - 4px);`;
		} else {
			// Original zero-based positioning
			positioning = isNegative
				? `right: calc(100% - ${Math.min(zeroPercent, 100)}%); width: ${barPercent}%; max-width: calc(${Math.min(zeroPercent, 100)}% - 4px);`
				: `left: calc(${Math.max(zeroPercent, 0)}%); width: ${barPercent}%; max-width: calc(100% - ${Math.max(zeroPercent, 0)}% - 4px);`;
		}

		// Color logic: negative uses bar_color_negative if set, otherwise falls back to bar_color, then defaults
		// Positive uses bar_color if set, then defaults
		let customColor = '';
		if (isNegative) {
			const negativeColor =
				tableMeasure?.bar_options?.bar_color_negative || tableMeasure?.bar_options?.bar_color;
			if (negativeColor) customColor = `background-color: ${negativeColor};`;
		} else {
			if (tableMeasure?.bar_options?.bar_color)
				customColor = `background-color: ${tableMeasure.bar_options.bar_color};`;
		}

		return positioning + ' ' + customColor;
	});

	// Check if we should show this bar visualization
	const shouldShow = $derived(
		!isNaN(Number(value)) &&
			row.render_type !== 'row_total' &&
			(tableMeasure?.viz_include_subtotals !== false || row.render_type !== 'row_subtotal')
	);
</script>

{#if shouldShow}
	<!-- Axis line at zero point - only show if zero is within bounds and not using fit_to_data -->
	{#if !fitToData && zeroPercent >= 0 && zeroPercent <= 100}
		<div class="bg-border absolute top-0 bottom-0 z-10 w-px" style="left: {zeroPercent}%;"></div>
	{/if}

	{#if !isZero || fitToData}
		<!-- Bar -->
		<div
			class={cn(
				'absolute top-0.5 bottom-0.5 opacity-40',
				!tableMeasure?.bar_options?.bar_color &&
					!tableMeasure?.bar_options?.bar_color_negative &&
					row.render_type === 'cell_data' &&
					(isNegative ? 'bg-(--theme-negative)/85' : 'bg-(--theme-table-bar)'),
				!tableMeasure?.bar_options?.bar_color &&
					!tableMeasure?.bar_options?.bar_color_negative &&
					row.render_type === 'row_subtotal' &&
					row.subtotal_level !== null &&
					(isNegative
						? subtotalLevels.negative[row.subtotal_level % subtotalLevels.negative.length]
						: subtotalLevels.positive[row.subtotal_level % subtotalLevels.positive.length])
			)}
			style={barStyle}
		></div>
	{/if}
{/if}
