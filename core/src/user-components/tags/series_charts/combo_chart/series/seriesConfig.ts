import type { ScatterSeriesOption, LineSeriesOption, BarSeriesOption } from 'echarts';
import { getMinMax } from '../../../../getMinMax';
import { canonicalizeTimeAxisValue } from '../../../../formatValue';
import type { DataPoint } from '../../../../types';
import { fillGaps, type HandleMissing } from '../../../../common/fill-gaps';
import type { DateGrain } from '../../../../common/date-options';
import { untrack } from 'svelte';
import {
	extractTooltipExtras,
	type ProcessedTooltipField
} from '../../../../common/tooltip-fields';

type ChartSeriesOption = ScatterSeriesOption | LineSeriesOption | BarSeriesOption;

export type SeriesConfigOptions = {
	data: DataPoint[];
	type: ChartSeriesOption['type'];
	x: string;
	y: string;
	series?: string;
	size?: string;
	pointTitle?: string;
	seriesColors?: Record<string, string>;
	seriesOrder?: string[];
	treatAsCategoryAxis?: boolean;
	/** How to handle missing data points (default: 'connect') */
	handleMissing?: HandleMissing;
	/** Date grain for temporal gap filling */
	dateGrain?: DateGrain;
	/** JavaScript type of x column from QueryResult.columns[].jsType */
	xColumnType?: 'date' | 'number' | 'string';
	/**
	 * Whether to generate new X values that don't exist in the data.
	 * - true: Generate missing X positions (for line/area with handle_missing='gaps'|'zero')
	 * - false: Only do cross-series alignment at existing X values (for bar charts)
	 *
	 * Bar charts should always be false (no phantom bars).
	 * Defaults based on chart type: false for bar, true for line/scatter.
	 */
	generateMissingXValues?: boolean;
	/** Stack identifier for stacked series (e.g., 'stack1') */
	stackId?: string;
	/**
	 * Sort data by stack totals (sum of all y values at each x position).
	 * Only applies to stacked multi-series charts.
	 * - 'asc': Sort by total ascending (smallest stacks first)
	 * - 'desc': Sort by total descending (largest stacks first)
	 * - undefined: No stack-based sorting
	 */
	sortByStackTotal?: 'asc' | 'desc';
	/**
	 * Explicit x-value order (from `sort=[...]` or a cross-series ordering
	 * derived from `sort="y asc"/"y desc"`). Takes precedence over
	 * `sortByStackTotal`. Dates match by ISO instant so cross-child ordering
	 * with `Date` x values works.
	 */
	xValueOrder?: readonly (string | number | Date)[];
	/**
	 * When true, drop rows whose x isn't in `xValueOrder`. Set by ComboChart
	 * for the `sort="y *"` + `limit=` top-N slice so the rendered category
	 * count matches SQL `LIMIT` semantics (otherwise the reorder would keep
	 * unlisted rows tacked on the end and blow past the author's limit).
	 * Ignored when `xValueOrder` isn't set.
	 */
	xValueOrderIsExhaustive?: boolean;
	/**
	 * Direction the anti-zigzag x-sort should use for line/area on a non-
	 * category axis. `'desc'` when the author explicitly set `sort="x desc"`
	 * (so a reverse-timeline line still draws monotonically); otherwise
	 * `'asc'` (default). Ignored for bar/scatter/bubble types.
	 */
	xSortDirection?: 'asc' | 'desc';
	/**
	 * Processed tooltip fields for this series. When set, each data item is
	 * emitted in ECharts' `{ value, extras }` object form so the parent
	 * tooltip formatter can look up the raw values by field alias without
	 * requerying. Keeping this a hot path opt-in: unset means we stay on the
	 * cheap array-tuple form for `data`.
	 */
	tooltipFields?: ProcessedTooltipField[];
};

/**
 * Calculates the appropriate symbol size for bubble charts based on the data point's size value
 * and the maximum size in the dataset
 *
 * @param dataPoint The data point to calculate size for
 * @param maxSize The maximum size value in the dataset
 * @returns The calculated symbol size for the bubble
 */
function calculateBubbleSize(dataPoint: [number, number, number], maxSize: number): number {
	const MAX_BUBBLE_SIZE = 35;
	const MAX_BUBBLE_SIZE_SQ = Math.pow(MAX_BUBBLE_SIZE, 2);

	const pointSize = Math.max(Number(dataPoint[2]) || 0, 0);
	return Math.sqrt((pointSize / maxSize) * MAX_BUBBLE_SIZE_SQ);
}

/**
 * Generates series configuration for ECharts based on data and series options
 *
 * @param options Configuration options for series generation
 * @returns Array of series configurations for ECharts
 */
export function generateSeriesConfig(options: SeriesConfigOptions): ChartSeriesOption[] {
	const {
		data,
		type,
		x,
		y,
		series,
		size,
		pointTitle,
		seriesColors,
		seriesOrder,
		treatAsCategoryAxis,
		handleMissing = 'connect',
		dateGrain,
		xColumnType,
		generateMissingXValues,
		sortByStackTotal,
		xValueOrder,
		xValueOrderIsExhaustive,
		xSortDirection = 'asc',
		tooltipFields
	} = options;

	const hasTooltipFields = !!tooltipFields && tooltipFields.length > 0;

	// Determine if we should generate new X values (positions that don't exist in the data)
	// - Bar charts: NEVER - bars represent discrete data, no phantom bars
	// - Line/scatter: Only if user explicitly wants gaps or zeros for visual continuity
	const shouldGenerateMissingXValues =
		generateMissingXValues ?? (type !== 'bar' && handleMissing !== 'connect');

	// If no data, return empty series
	if (!data || data.length === 0) {
		return [];
	}

	const sourceRows = new Set(data);

	// Check if series property exists in the data points
	const hasSeries = series && data.some((point) => point[series] !== undefined);

	// Check if size property exists for bubble charts
	const hasSize = size && data.some((point) => point[size] !== undefined);
	let sizeMax = 1;

	if (hasSize && type === 'scatter' && size) {
		// Use getMinMax to find the maximum size value
		const { max } = getMinMax(data, size);
		sizeMax = max || 1; // Default to 1 if max is null
	}

	// Normalize the x value ECharts positions on:
	//  - category axes: numeric x → string, so ECharts doesn't treat it as an
	//    array index.
	//  - time axes: strip any UTC offset from date strings so the bar lands on
	//    the same wall-clock instant our tick/label pipeline parses to (see
	//    `canonicalizeTimeAxisValue`). This keeps the display identical for every
	//    viewer regardless of their browser timezone.
	const isTimeAxis = xColumnType === 'date' && !treatAsCategoryAxis;
	const formatXValue = (value: unknown): string | number | Date => {
		if (treatAsCategoryAxis && typeof value === 'number') return String(value);
		if (isTimeAxis) return canonicalizeTimeAxisValue(value) as string | number | Date;
		return value as string | number | Date;
	};

	// Build one data item — a bare tuple by default, or the object form when
	// tooltip_fields is set so we can attach `extras` for the formatter.
	// Keeping the tuple path for the common case avoids allocating one wrapper
	// object per point when tooltip_fields is unused (~all existing charts).
	const buildDataItem = (row: DataPoint) => {
		const tuple = [
			formatXValue(row[x]),
			row[y],
			size ? row[size] : undefined,
			pointTitle ? row[pointTitle] : undefined
		];
		if (type === 'bar' && !sourceRows.has(row)) return { value: tuple, isMissing: true };
		if (!hasTooltipFields) return tuple;
		return { value: tuple, extras: extractTooltipExtras(row, tooltipFields!) };
	};

	// Only hide symbols for line/area charts, not bars
	const isLineType = type === 'line';

	// If no series property in data points, use the default single series (y column)
	if (!hasSeries) {
		// Apply gap filling for single series when requested
		// For bar charts, this only matters if user explicitly wants gap filling
		let processedData =
			handleMissing !== 'connect' && shouldGenerateMissingXValues
				? fillGaps({
						data,
						xColumn: x,
						yColumn: y,
						sizeColumn: size,
						handleMissing,
						dateGrain,
						xColumnType,
						generateMissingXValues: shouldGenerateMissingXValues
					})
				: data;

		// Explicit array order (from `sort=[...]`) applies to single-series too;
		// otherwise a plain bar_chart with an array sort would silently no-op
		// (SQL emits a stable `ORDER BY x` for LIMIT determinism, nothing here).
		// Scatter/bubble skip this — points position by (x, y) coordinates on
		// continuous axes, so a reorder only shuffles the underlying array with
		// no visible effect. Applying it anyway would silently affect series
		// color assignment on a scatter with a `series=` column (feedback from
		// PR #1983 audit).
		if (xValueOrder && xValueOrder.length > 0 && type !== 'scatter') {
			processedData = reorderDataByXValueOrder(
				processedData,
				x,
				xValueOrder,
				xValueOrderIsExhaustive ?? false
			);
		}

		// Line series on a value/time x axis: the polyline connects points in
		// array order, so a non-monotonic-in-x arrival (from `sort="y desc"`,
		// an inline SQL `ORDER BY value`, or an author-set `xValueOrder`)
		// draws a zigzag instead of a timeline. Sort by x here so line/area
		// always render monotonic. `sort="x desc"` is honored — descending IS
		// monotonic and a legitimate reverse-timeline. Bars are unaffected
		// (they position by x independently). Same rule in the multi-series
		// branch below.
		if (isLineType && !treatAsCategoryAxis) {
			processedData = sortRowsByX(processedData, x, xSortDirection);
		}

		// Note: Don't add explicit ChartSeriesOption type annotation here.
		// TypeScript can't narrow discriminated unions when the discriminant is a union value.
		const seriesConfig = {
			data: processedData.map(buildDataItem),
			type: type as 'line' | 'scatter' | 'bar',
			// Disable large mode for bubble charts - it doesn't support custom symbolSize functions
			large: hasSize && type === 'scatter' ? false : true,
			largeThreshold: 1000,
			sampling: 'lttb',
			symbol: 'circle',
			symbolSize: 9,
			showSymbol: true,
			triggerEvent: true, // Enable hover events on the line itself, not just points
			lineStyle: {
				width: 1.75
			},
			barMaxWidth: 60,
			emphasis: {
				focus: 'series' as const,
				blurScope: 'coordinateSystem' as const,
				lineStyle: isLineType ? { width: 3 } : undefined,
				itemStyle: isLineType ? { opacity: 1 } : undefined
			},
			// Only hide symbols for line charts - bars use itemStyle for the bar fill
			itemStyle: isLineType ? { opacity: 0 } : undefined
		};

		// Add symbolSize function for bubble charts (when size column is provided)
		if (hasSize && type === 'scatter') {
			(seriesConfig as ScatterSeriesOption).symbolSize = function (dataPoint: number | number[]) {
				// Handle both array and object format
				const point = Array.isArray(dataPoint)
					? dataPoint
					: (dataPoint as unknown as { value: [number, number, number] }).value;
				return calculateBubbleSize(point as [number, number, number], sizeMax);
			};
		}

		return [seriesConfig as ChartSeriesOption];
	}

	// Fill gaps for multi-series charts (handles early exits internally)
	// This handles:
	// 1. Cross-series alignment: ensure all series have values at all X positions (for stacking)
	// 2. Missing X values (optional): generate new positions when explicitly requested
	//
	// For bar charts: only do cross-series alignment, no new X positions (no phantom bars)
	// For line/area: do both if user sets handle_missing='gaps'|'zero'
	let filledData = fillGaps({
		data,
		xColumn: x,
		yColumn: y,
		seriesColumn: series!,
		sizeColumn: size,
		handleMissing,
		dateGrain,
		xColumnType,
		generateMissingXValues: shouldGenerateMissingXValues
	});

	// Explicit array order (from `sort=[...]` or a cross-child derived order)
	// takes precedence over the legacy stack-total sort. Skip for scatter —
	// see the single-series branch above for why (positions come from the
	// (x, y) coordinates on continuous axes).
	if (xValueOrder && xValueOrder.length > 0 && type !== 'scatter') {
		filledData = reorderDataByXValueOrder(
			filledData,
			x,
			xValueOrder,
			xValueOrderIsExhaustive ?? false
		);
	} else if (sortByStackTotal) {
		// Legacy stacked + x_sort=asc/desc path — unchanged.
		filledData = sortDataByStackTotal(filledData, x, y, sortByStackTotal);
	}

	// Line on a value/time x axis: enforce monotonic x order so the polyline
	// doesn't zigzag. Direction respects `sort="x desc"`. See single-series
	// branch above for the full rationale.
	if (isLineType && !treatAsCategoryAxis) {
		filledData = sortRowsByX(filledData, x, xSortDirection);
	}

	// Group data by series in a single pass (O(n) instead of O(n × series))
	const seriesDataMap = new Map<unknown, typeof filledData>();
	untrack(() => {
		for (const row of filledData) {
			const seriesVal =
				series && row[series] !== undefined && row[series] !== null ? row[series] : 'Unknown';
			if (!seriesDataMap.has(seriesVal)) {
				seriesDataMap.set(seriesVal, []);
			}
			seriesDataMap.get(seriesVal)!.push(row);
		}
	});

	const seriesValues = [...seriesDataMap.keys()];

	// Build series configs
	const seriesConfigs = seriesValues.map((seriesValue) => {
		// Get pre-grouped data for this series (no filtering needed!)
		const seriesRows = seriesDataMap.get(seriesValue)!;

		// Build series data as [x, y, size, pointTitle] coordinate pairs
		// (or the object form with `extras` when tooltip_fields is set)
		const seriesData = untrack(() => seriesRows.map(buildDataItem));

		// Check if seriesColors mapping exists for this series value
		const seriesColorValue = seriesColors?.[String(seriesValue)];

		const seriesConfig = {
			name: String(seriesValue),
			type: type as 'line' | 'scatter' | 'bar',
			data: seriesData,
			// Disable large mode for bubble charts - it doesn't support custom symbolSize functions
			large: hasSize && type === 'scatter' ? false : true,
			largeThreshold: 1000,
			sampling: 'lttb',
			symbol: 'circle',
			symbolSize: 9,
			showSymbol: true,
			triggerEvent: true, // Enable hover events on the line itself, not just points
			lineStyle: {
				width: 1.75
			},
			barMaxWidth: 60,
			emphasis: {
				focus: 'series' as const,
				blurScope: 'coordinateSystem' as const,
				lineStyle: isLineType ? { width: 3 } : undefined,
				itemStyle: isLineType ? { opacity: 1 } : undefined
			},
			// Only hide symbols for line charts - bars use itemStyle for the bar fill
			itemStyle: isLineType ? { opacity: 0 } : undefined,
			color: seriesColorValue
		};

		// Add symbolSize function for bubble charts (when size column is provided)
		if (hasSize && type === 'scatter') {
			(seriesConfig as ScatterSeriesOption).symbolSize = function (dataPoint: number | number[]) {
				// Handle both array and object format
				const point = Array.isArray(dataPoint)
					? dataPoint
					: (dataPoint as unknown as { value: [number, number, number] }).value;
				return calculateBubbleSize(point as [number, number, number], sizeMax);
			};
		}

		return seriesConfig as ChartSeriesOption;
	});

	// Sort series based on seriesOrder if provided
	if (seriesOrder && seriesOrder.length > 0) {
		const orderMap = new Map(seriesOrder.map((name, index) => [name, index]));
		seriesConfigs.sort((a, b) => {
			const aOrder = orderMap.get(String(a.name));
			const bOrder = orderMap.get(String(b.name));

			// Both in order array: sort by their position
			if (aOrder !== undefined && bOrder !== undefined) {
				return aOrder - bOrder;
			}
			// Only a is in order: a comes first
			if (aOrder !== undefined) return -1;
			// Only b is in order: b comes first
			if (bOrder !== undefined) return 1;
			// Neither in order: maintain original order
			return 0;
		});
	}

	return seriesConfigs;
}

/**
 * Sort rows by their x value so a polyline draws left-to-right on a
 * value/time axis. ECharts positions each line point at its own x, but
 * connects them in ARRAY ORDER — so a query returning rows in y-desc
 * order (or any non-monotonic-x order) produces a criss-cross line that
 * jumps back and forth across the chart. Applied for `type === 'line'`
 * on any non-category axis. Bars are unaffected because their placement
 * is set by the x value alone.
 *
 * Idempotent: rows already sorted by x land in the same positions.
 * Dates compare by millisecond; numbers by subtraction; strings fall back
 * to lexical compare (unusual on a non-category axis but stable).
 */
function sortRowsByX(
	data: DataPoint[],
	xColumn: string,
	direction: 'asc' | 'desc' = 'asc'
): DataPoint[] {
	if (data.length < 2) return data;
	// Stable JS sort. Non-numeric/non-Date values fall back to string compare
	// so a mixed batch never throws — the axis type check above rules out the
	// category-string case where this fallback would misorder.
	const sign = direction === 'desc' ? -1 : 1;
	const compare = (a: DataPoint, b: DataPoint) => {
		const ax = a[xColumn];
		const bx = b[xColumn];
		if (ax instanceof Date && bx instanceof Date) return sign * (ax.getTime() - bx.getTime());
		if (typeof ax === 'number' && typeof bx === 'number') return sign * (ax - bx);
		return sign * String(ax).localeCompare(String(bx));
	};
	return [...data].sort(compare);
}

/**
 * Reorders rows so x values appear in the order supplied by `xValueOrder`.
 * Runs at the client layer so the same ordering applies uniformly across
 * every series/child in a chart.
 *
 * `exhaustive=false` (default, used by `sort=[...]`): unlisted rows keep
 * their relative position and land after the ordered ones.
 *
 * `exhaustive=true` (used by `sort="y *"` + `limit=` top-N): unlisted rows
 * are dropped. Without this, ComboChart's SQL LIMIT drop for cross-series
 * ranking would leak past the author's `limit=` because the reorder alone
 * doesn't filter — rows outside the top-N would still render at the end.
 */
function reorderDataByXValueOrder(
	data: DataPoint[],
	xColumn: string,
	xValueOrder: readonly (string | number | Date)[],
	exhaustive: boolean
): DataPoint[] {
	if (data.length === 0 || xValueOrder.length === 0) return data;

	// Date/number keys are string-normalized (matches fill-gaps.ts convention).
	const toKey = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v));
	const orderMap = new Map<string, number>();
	xValueOrder.forEach((val, i) => orderMap.set(toKey(val), i));

	const indexed = data
		.map((row, i) => ({ row, i, order: orderMap.get(toKey(row[xColumn])) }))
		.filter((entry) => !exhaustive || entry.order !== undefined);

	indexed.sort((a, b) => {
		if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
		if (a.order !== undefined) return -1;
		if (b.order !== undefined) return 1;
		return a.i - b.i;
	});
	return indexed.map((entry) => entry.row);
}

/**
 * Sorts data by stack totals (sum of y values for each x position).
 * Used for x_sort on stacked charts where we want to order by total bar height.
 */
function sortDataByStackTotal(
	data: DataPoint[],
	xColumn: string,
	yColumn: string,
	direction: 'asc' | 'desc'
): DataPoint[] {
	if (data.length === 0) return data;

	// Calculate totals per x value
	const totalsMap = new Map<unknown, number>();
	for (const row of data) {
		const xVal = row[xColumn];
		const yVal = Number(row[yColumn]) || 0;
		totalsMap.set(xVal, (totalsMap.get(xVal) || 0) + yVal);
	}

	// Get unique x values sorted by their totals
	const xValues = [...new Set(data.map((row) => row[xColumn]))];
	xValues.sort((a, b) => {
		const totalA = totalsMap.get(a) || 0;
		const totalB = totalsMap.get(b) || 0;
		return direction === 'asc' ? totalA - totalB : totalB - totalA;
	});

	// Create a map of x value to sort order
	const sortOrderMap = new Map<unknown, number>();
	xValues.forEach((xVal, index) => {
		sortOrderMap.set(xVal, index);
	});

	// Sort data by the x value order
	return [...data].sort((a, b) => {
		const orderA = sortOrderMap.get(a[xColumn]) ?? Infinity;
		const orderB = sortOrderMap.get(b[xColumn]) ?? Infinity;
		return orderA - orderB;
	});
}
