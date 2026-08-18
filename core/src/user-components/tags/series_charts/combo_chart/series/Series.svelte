<script lang="ts">
	/**
	 * Series Component - Thin Wrapper
	 *
	 * Each series (Line, Bar, Area, Scatter, Bubble) has its own SeriesModel that:
	 * - Processes column expressions
	 * - Builds query config from shared context + series-specific columns
	 * - Creates and owns its Query instance
	 *
	 * This component is a thin wrapper that:
	 * - Gets Svelte contexts (chart context)
	 * - Registers the series with the parent ComboChart
	 *
	 * Note: Query registration for export is handled by the parent ComboChart,
	 * which consolidates all series data into a single combined query object.
	 */
	import type { DataPoint, UserComponentProps } from '../../../../types';
	import type { SeriesOption } from 'echarts';
	import { getComboChartContext } from '../combo-chart-context';
	import { schema } from './schema';
	import { onMount } from 'svelte';

	export type SeriesUserProps = UserComponentProps<typeof schema>;
	export type SeriesInternalProps = {
		type: 'bar' | 'line' | 'scatter';
		/** Display name for component console (defaults to type if not provided) */
		tagName?: string;
		/** Metric-mode legend label override; the `y` column keeps its raw-name alias. */
		yLabel?: string;
		/** Size column for bubble charts */
		size?: string;
		transformSeriesOptions?: (options: SeriesOption) => void;
		getYMinMax?: (
			data: DataPoint[],
			x: string,
			y: string
		) => { min: number | null; max: number | null };
		/** Whether to transform data to percentages for 100% stacked charts */
		percentageStack?: boolean;
		/** Whether this series uses stacking (needed for auto category axis + zero fill) */
		isStacked?: boolean;
		/** Stack identifier for stacked charts (e.g., 'stack1') */
		stackId?: string;
	};
	export type SeriesProps = SeriesUserProps & SeriesInternalProps;

	const {
		transformSeriesOptions,
		getYMinMax,
		size,
		percentageStack,
		isStacked,
		stackId,
		...props
	}: SeriesProps = $props();

	const chartContext = getComboChartContext();

	// Register this series with the parent combo chart
	onMount(() => {
		const { removeSeries } = chartContext.addSeries(() => ({
			...props,
			size,
			transformSeriesOptions,
			getYMinMax,
			percentageStack,
			isStacked,
			stackId
		}));

		return () => {
			removeSeries();
		};
	});
</script>
