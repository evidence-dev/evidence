import { getContext, setContext } from 'svelte';
import type { SeriesProps } from './series/Series.svelte';
import type { SeriesModel } from './series/SeriesModel.svelte';
import type { ReferenceLineProps } from './references/reference_line/types';
import type { ReferenceLineStaticModel } from './references/reference_line/ReferenceLineStaticModel.svelte';
import type { ReferenceAreaStaticModel } from './references/reference_area/ReferenceAreaStaticModel.svelte';
import type { ReferenceAreaProps } from './references/reference_area/types';
import type { ReferencePointStaticModel } from './references/reference_point/ReferencePointStaticModel.svelte';
import type { ReferencePointProps } from './references/reference_point/types';
import type { QueryDependencies } from '../../../../Query.svelte';
import type { DateRangeObject } from '../../../common/date-options';

const COMBO_CHART_CONTEXT_KEY = Symbol('COMBO_CHART_CONTEXT');

/**
 * Shared query configuration that all child series use to build their own queries.
 * Carries raw user-provided attributes — child SeriesModels call buildChartSQLConfig
 * with these, so the same flat attribute flow is used at runtime and in tests.
 */
export type SharedQueryContext = {
	/**
	 * Table name or expression to query. `undefined` when the combo_chart has no
	 * `data=` and every child series uses `metric=` — in that mode each child
	 * resolves its own base from its metric view, and this shared context's
	 * `tableExpressionName` is unused.
	 */
	tableExpressionName: string | undefined;
	/** Raw x-axis column expression (post variable resolution, pre date_grain processing) */
	x: string | undefined;
	/**
	 * Author's explicit `x=` on the combo_chart tag (BEFORE the all-metric-children
	 * fallback that folds in the first metric child's viewDate). Metric children
	 * use this to distinguish "author overrode the axis" (respect it) from "just
	 * inheriting from sibling #1" (a cross-base child should use its OWN viewDate
	 * instead, or the query targets the wrong table's date column).
	 */
	explicitX: string | undefined;
	/** Raw point_title column expression for scatter/bubble tooltip labels */
	point_title: string | undefined;
	/**
	 * Effective date grain for the combo_chart's time series: either the author's
	 * explicit `date_grain=` on the parent OR the coarsest grain across all
	 * metric children's view grains (so a monthly-view + daily-view combo picks
	 * month and both children bucket their queries to align). Children in metric
	 * mode read this directly rather than their own metric.viewGrain.
	 */
	dateGrain: string | undefined;
	/** Filter IDs to apply to the query */
	filters: unknown[] | undefined;
	/** WHERE clause to apply */
	where: string | undefined;
	/** Date range configuration */
	dateRange: DateRangeObject | undefined;
	/** SQL HAVING clause */
	having: string | undefined;
	/** SQL QUALIFY clause */
	qualify: string | undefined;
	/** Raw user-provided ORDER BY (buildChartSQLConfig applies x-column fallback) */
	order: string | undefined;
	/** Raw user-provided x_sort — takes precedence over `order` in buildChartSQLConfig */
	x_sort: string | readonly string[] | undefined;
	/** LIMIT clause */
	limit: number | undefined;
	/** Query dependencies (queryService, filterContexts, etc.) */
	queryDeps: QueryDependencies;
	/** Component-level refresh interval in seconds (overrides page default) */
	refreshInterval: number | undefined;
	/** First day of week for date calculations */
	firstDayOfWeek: 'sunday' | 'monday';
};

export type ComboChartContext = {
	/** Shared query configuration for all children */
	getSharedQueryContext: () => SharedQueryContext;

	addSeries: (propsGetter: () => SeriesProps) => { series: SeriesModel; removeSeries: () => void };

	addReferenceLine: (propsGetter: () => ReferenceLineProps) => {
		referenceLine: ReferenceLineStaticModel;
		removeReferenceLine: () => void;
	};
	addReferenceArea: (propsGetter: () => ReferenceAreaProps) => {
		referenceArea: ReferenceAreaStaticModel;
		removeReferenceArea: () => void;
	};
	addReferencePoint: (propsGetter: () => ReferencePointProps) => {
		referencePoint: ReferencePointStaticModel;
		removeReferencePoint: () => void;
	};
};

export const setComboChartContext = (context: ComboChartContext): ComboChartContext => {
	setContext(COMBO_CHART_CONTEXT_KEY, context);
	return context;
};

export const getComboChartContext = (): ComboChartContext => {
	const context = getContext<ComboChartContext | undefined>(COMBO_CHART_CONTEXT_KEY);
	if (!context) {
		throw new Error('Combo Chart Context not set!');
	}
	return context;
};
