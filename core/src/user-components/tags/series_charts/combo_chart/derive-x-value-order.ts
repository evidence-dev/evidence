/**
 * Derive the chart-level x-value order used by every series/child in a
 * combo chart. Pure and dependency-free so it's unit-testable without
 * Svelte state or a live chart instance.
 */

/** One child's contribution to the cross-series ordering. */
export interface SeriesXValueRows {
	rows: readonly Record<string, unknown>[];
	yColumnName: string;
}

export interface DeriveXValueOrderOptions {
	sort: string | readonly (string | number)[] | undefined;
	/** True for multi-child combo, top-level `series=`, or single-child stacked. */
	hasMultipleSeries: boolean;
	hasStackedSeries: boolean;
	xColumnName: string | undefined;
	series: readonly SeriesXValueRows[];
	/**
	 * ComboChart passes the author's `limit=` here whenever it dropped SQL
	 * LIMIT to let this derivation rank across complete data. The returned
	 * order is sliced to the same top-N so the visible category count still
	 * matches `limit`. The caller must ALSO filter rows outside the returned
	 * order — this helper only produces the ordering, `xValueOrderIsExhaustive`
	 * on `getSeriesConfig` is the flag that turns the slice into a filter.
	 */
	limitTopN?: number;
}

export type XValue = string | number | Date;

/**
 * Multi-child combos rank on the FIRST child's y only. Matches Tableau/Power
 * BI/Superset/Vega-Lite: dual-axis and layered charts always require you to
 * pick one measure to sort by. Summing across children would be dimensionally
 * mixed on mixed-measure combos (dollars + counts + percentages) and the
 * larger-scale measure would dominate the ranking. Escape hatch when the
 * author needs a different ranking: put that child first, or use `order=`
 * for a raw SQL ORDER BY, or `sort=[...]` for an explicit category list.
 *
 * Single-query multi-series (top-level `series=`) and stacked single-child
 * still aggregate across the ONE child's own series column — same measure at
 * every stack segment, so the total has consistent units. That's the stack-
 * total pattern every BI tool supports.
 */
export function deriveXValueOrder(
	options: DeriveXValueOrderOptions
): readonly XValue[] | undefined {
	const { sort, hasMultipleSeries, hasStackedSeries, xColumnName, series, limitTopN } = options;

	if (Array.isArray(sort) && sort.length > 0) {
		return sort as readonly XValue[];
	}

	if (
		(sort === 'y asc' || sort === 'y desc') &&
		(hasMultipleSeries || hasStackedSeries) &&
		xColumnName
	) {
		const direction = sort === 'y desc' ? 'desc' : 'asc';

		// Rank on the first child only — it's by convention the primary
		// measure (visually dominant, on y1) and always well-defined
		// regardless of what other children measure. Aggregate within that
		// one child so a stacked/single-query-multi-series shape ranks by
		// stack total, not by an arbitrary segment.
		const primary = series[0];
		if (!primary) return undefined;

		// Preserve the first-seen x value beside its key so the returned
		// order round-trips the original type (Date/number/string).
		const totals = new Map<string, { xVal: XValue; sum: number }>();
		for (const row of primary.rows) {
			const xRaw = row[xColumnName];
			if (xRaw === null || xRaw === undefined) continue;
			const xVal = xRaw as XValue;
			const yVal = Number(row[primary.yColumnName]) || 0;
			// ISO for Date so two Date instances at the same instant merge.
			const key = xVal instanceof Date ? xVal.toISOString() : String(xVal);
			const existing = totals.get(key);
			if (existing) {
				existing.sum += yVal;
			} else {
				totals.set(key, { xVal, sum: yVal });
			}
		}
		if (totals.size === 0) return undefined;

		const ordered = [...totals.values()]
			.sort((a, b) => (direction === 'desc' ? b.sum - a.sum : a.sum - b.sum))
			.map((entry) => entry.xVal);

		if (typeof limitTopN === 'number' && limitTopN > 0) {
			return ordered.slice(0, limitTopN);
		}
		return ordered;
	}

	return undefined;
}
