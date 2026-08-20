import { buildTooltipContent } from './tooltipHelpers';
import { getComparisonTooltipContext } from './ComparisonTooltip.svelte';

/**
 * Composable for adding comparison tooltips to any component
 * Uses the global event delegation system for performance
 */
export function useComparisonTooltip() {
	const tooltip = getComparisonTooltipContext();

	/**
	 * Create tooltip event handlers for an element
	 */
	function createTooltipHandlers(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		comparison: Record<string, any> | undefined,
		row: Record<string, unknown>,
		rawData?: Record<string, unknown>[],
		dimensionFields?: string[],
		pivotFields?: string[],
		comparisonId?: string,
		resultField?: string,
		currentColumnKey?: string,
		measures_first = false,
		format?: string
	) {
		if (!comparison?.compare_vs) {
			return {
				onmouseenter: undefined,
				onmouseleave: undefined
			};
		}

		const onmouseenter = (event: MouseEvent) => {
			if (!comparison.compare_vs) return;

			const tooltipContent = buildTooltipContent(
				comparison.compare_vs,
				row,
				rawData,
				dimensionFields,
				pivotFields,
				comparisonId,
				resultField,
				currentColumnKey,
				measures_first,
				format,
				comparison.abs_fmt,
				comparison.pct_fmt,
				comparison.hide_pct ?? false
			);

			tooltip.scheduleShow(
				event.currentTarget as HTMLElement,
				tooltipContent.title,
				tooltipContent.rows
			);
		};

		const onmouseleave = () => {
			tooltip.scheduleHide();
		};

		return {
			onmouseenter,
			onmouseleave
		};
	}

	return {
		createTooltipHandlers
	};
}
