import { formatValue } from '../../../formatValue';
import { getMinMax } from '../../../getMinMax';
import { z } from 'zod';
import type { SeriesModel } from './series/SeriesModel.svelte';
import type { YAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel.js';
import { yAxisOptionsSchema } from './y-axis-options-schema';
import { coerceBoolean, coerceNumber } from '../../../common/process-variables';

export type YAxisOptions = z.infer<typeof yAxisOptionsSchema> & {
	fmt?: string;
};

export class YAxisModel {
	readonly options: YAxisOptions;

	get series() {
		return this.#seriesForAllAxes.filter((series) => series.props.axis === this.axis);
	}

	get yValues() {
		return this.series.map((series) => series.props.y);
	}

	get title() {
		if (typeof this.options.title !== 'undefined') {
			return this.options.title;
		}
		if (this.series.length === 1) {
			return this.series[0].yProcessed.displayAlias;
		}
	}

	#seriesForAllAxes: SeriesModel[] = $state([]);

	constructor(
		readonly axis: 'y1' | 'y2',
		readonly optionsGetter: () => YAxisOptions,
		readonly xColumnNameGetter: () => string | undefined
	) {
		this.options = $derived(this.optionsGetter());
	}

	addSeries = (seriesModel: SeriesModel): void => {
		this.#seriesForAllAxes.push(seriesModel);
	};

	removeSeries = (seriesModel: SeriesModel): void => {
		this.#seriesForAllAxes.splice(this.#seriesForAllAxes.indexOf(seriesModel), 1);
	};

	readonly axisConfig = $derived.by((): YAXisOption => {
		// When no series are on this axis, return minimal config to preserve alignTicks behavior
		// This prevents ECharts from using different tick calculation when paired axes have mismatched configs
		if (this.series.length === 0) {
			return {
				alignTicks: true,
				show: false
			};
		}

		const xColumnName = this.xColumnNameGetter();
		if (!xColumnName) return {};

		// Get ECharts type from first series' query result
		const firstSeriesColumns = this.series[0]?.query?.result?.columns;
		const type = firstSeriesColumns
			? this.series[0]?.getEChartsType(firstSeriesColumns)
			: undefined;

		// Check if all series on this axis are percentage-stacked
		const allPercentageStacked =
			this.series.length > 0 && this.series.every((s) => s.props.percentageStack);

		// Calculate min/max range across all series on this axis
		// Each series now has its own query and data
		const range = this.series.reduce(
			(acc, m) => {
				const seriesData = m.query?.result?.rows ?? [];
				const { min: seriesMin, max: seriesMax } = m.props.getYMinMax
					? m.props.getYMinMax(seriesData, xColumnName, m.yColumnName)
					: getMinMax(seriesData, m.yColumnName);

				if (seriesMin !== null) acc.min = Math.min(acc.min ?? Infinity, seriesMin);
				if (seriesMax !== null) acc.max = Math.max(acc.max ?? -Infinity, seriesMax);
				return acc;
			},
			{ min: null as number | null, max: null as number | null }
		);

		// Use user-provided min/max, or fall back to calculated range
		// For percentage stacking, default to 0-1 range (SSF % format will display as 0%-100%)
		// Coerce numbers in case they came from variable interpolation as strings
		const min = coerceNumber(this.options.min) ?? (allPercentageStacked ? 0 : range.min);
		const max = coerceNumber(this.options.max) ?? (allPercentageStacked ? 1 : range.max);

		// Determine axis format
		// For percentage-stacked axes, always use percentage format for axis labels
		// (user's y_fmt only affects the original value in tooltips, not the axis)
		const axisFormat = allPercentageStacked ? '0%' : this.options.fmt;

		// Title position: 'top' (default) or 'side'
		// Default to 'side' for percentage-stacked charts to avoid overlap at 100%
		const titlePosition = this.options.title_position ?? (allPercentageStacked ? 'side' : 'top');
		const isSideTitle = titlePosition === 'side';

		// Configure title position based on option
		const nameLocation = isSideTitle ? 'middle' : 'end';
		const nameRotate = isSideTitle ? (this.axis === 'y1' ? 90 : -90) : undefined;
		// Top titles: gap 0 + middle so the title is vertically centered on the
		// axis end, exactly like the top tick label centers on its tick
		const nameGap = isSideTitle ? 50 : 0;
		const nameTextStyle = isSideTitle
			? {
					// For side position, text is rotated so alignment is different
					align: 'center' as const,
					verticalAlign: 'middle' as const
				}
			: {
					align: (this.axis === 'y1' ? 'left' : 'right') as 'left' | 'right',
					verticalAlign: 'middle' as const,
					// Trailing-only padding: overhangs the background box past the text
					// (so the cut gridline resumes with a gap) without shifting the
					// glyphs off the axis anchor. Trailing = right for y1, left for y2.
					padding: (this.axis === 'y1' ? [1, 5, 1, 0] : [1, 0, 1, 5]) as [
						number,
						number,
						number,
						number
					]
				};

		return {
			type,
			min: coerceNumber(this.options.min) ?? (allPercentageStacked ? 0 : undefined),
			max: coerceNumber(this.options.max) ?? (allPercentageStacked ? 1 : undefined),
			scale: coerceBoolean(this.options.fit_to_data) ?? false,
			animation: false,
			name: type !== 'value' ? undefined : this.title,
			interval: coerceNumber(this.options.interval),
			nameLocation,
			nameRotate,
			nameTextStyle,
			alignTicks: true,
			axisTick: {
				show: coerceBoolean(this.options.ticks) ?? false
			},
			nameGap,
			// When true, moves the name to avoid overlap with axis labels
			nameMoveOverlap: isSideTitle ? true : false,
			axisLine: {
				show: coerceBoolean(this.options.baseline) ?? false, // Default: baseline OFF for y-axis
				onZero: false
			},
			axisLabel: {
				show: coerceBoolean(this.options.labels) ?? true,
				margin: 4,
				formatter: (value: unknown) => {
					return formatValue(value, axisFormat, value?.toString(), { min, max });
				}
			},
			// Only set when the chart explicitly configures gridlines; otherwise
			// the ECharts theme's valueAxis default decides (the chart.gridlines
			// token, which also carries the themed line color — an option-level
			// show:true would drop the theme's lineStyle in the merge)
			...(coerceBoolean(this.options.gridlines) !== undefined
				? { splitLine: { show: coerceBoolean(this.options.gridlines) } }
				: {})
		};
	});
}
