<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { Query } from '../../../Query.svelte';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import SparklineDisplay from './SparklineDisplay.svelte';
	import { getMetadataContext } from '../../../metadata/context';
	import { getEchartsType } from '../../common/typeConversions';
	import { schema } from './schema';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { extractSQLProps, type SQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { getDefaultFormatForDateGrain } from '../../common/date-options';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';
	import { getMetricsCatalogContext } from '../../../metrics/metrics-catalog';
	import { resolveMetric } from '../../../metrics/resolve-metric';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	// Define the props type to include SQLProps
	type Props = UserComponentProps<typeof schema> & SQLProps;

	// Parse props with defaults
	const props: Props = $props();

	const hasValidationErrors = $derived(hasBlockingErrors());

	// Extract SQL props in a centralized way
	const { where: rawWhere, having, limit, qualify } = $derived.by(() => extractSQLProps(props));

	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const getProjectSettings = getProjectSettingsContext();
	const projectSettings = $derived(getProjectSettings());

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	// `metric="revenue"` supplies base + aggregate SQL + default x/grain from the
	// view; explicit `data`/`x`/`y` win. Named dimension resolution for `x` is
	// deferred here — sparkline is a scalar-with-time-series, so `x` almost always
	// falls through to the view's time column.
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, connection.dialect)
	);
	// The metric attr is String | Array; sparkline is scalar so it uses the first
	// entry (matching resolveMetric's normalization).
	const firstMetricName = $derived(
		Array.isArray(resolvedMetric)
			? resolvedMetric.find((n): n is string => typeof n === 'string' && n.trim() !== '')?.trim()
			: typeof resolvedMetric === 'string' && resolvedMetric.trim() !== ''
				? resolvedMetric.trim()
				: undefined
	);
	const catalogMetric = $derived(
		firstMetricName ? metricsCatalog?.getMetric(firstMetricName) : undefined
	);
	// Metric- or view-level date column becomes the default x-axis when none set.
	const metricXColumn = $derived(catalogMetric?.metric.date ?? catalogMetric?.view.date);

	// Resolved props (explicit wins; else fall back to metric-derived defaults).
	const tableName = $derived(resolveText(props.data) ?? metricCompiled?.base);
	const x = $derived(resolveColumn(props.x) ?? metricXColumn);
	const y = $derived(resolveColumn(props.y) ?? metricCompiled?.valueExpression);
	const type = $derived(resolveText(props.type) ?? 'line');
	const color = $derived(resolveText(props.color));
	const y_fmt = $derived(
		resolveText(props.y_fmt) ??
			(metricCompiled ? metricCompiled.columnFormats[metricCompiled.name] : undefined)
	);
	const x_fmt = $derived(resolveText(props.x_fmt));
	const fit_to_data = $derived(props.fit_to_data ?? false);
	const interactive = $derived(props.interactive ?? true);
	const filterIds = $derived(props.filters);
	const order = $derived(resolveSql(props.order) ?? props.order);

	const where = $derived(resolveSql(props.where) ?? rawWhere);
	// Metric view's default grain buckets the TIME axis only. If the author points
	// x at a non-time column, defaulting the grain would date-truncate it and emit
	// nonsense — so only inherit when x resolved to the metric's time column.
	const date_grain = $derived(
		resolveText(props.date_grain) ??
			props.date_grain ??
			(x !== undefined && x === metricXColumn ? catalogMetric?.view.defaultDateGrain : undefined)
	);
	// Apply default format for date grains (like day of week, month of year, etc.)
	const effectiveXFmt = $derived(x_fmt ?? getDefaultFormatForDateGrain(date_grain));
	const resolvedDateRange = $derived(resolveText(props.date_range) ?? props.date_range);

	// Process columns using the new system
	const xProcessed = $derived.by(() => {
		if (!x) return undefined;
		return processColumnExpression(
			{
				value: x,
				dateGrain: date_grain,
				firstDayOfWeek: projectSettings.first_day_of_week
			},
			connection.dialect
		);
	});

	const yProcessed = $derived.by(() => {
		if (!y) return undefined;
		return processColumnExpression(
			{
				value: y
			},
			connection.dialect
		);
	});

	// Extract column aliases for use in chart rendering
	const xColumn = $derived(xProcessed?.alias);
	const yColumn = $derived(yProcessed?.alias);

	const width = 50;
	const height = 15;

	// Get metadata for column types
	const metadata = getMetadataContext();
	const xColumnType = $derived(
		tableName && x ? metadata.getTable(tableName)?.getColumn(x)?.type : undefined
	);

	// Determine ECharts column types
	const xEChartsType = $derived(getEchartsType(xColumnType));

	type Row = {
		x: string | number | Date | null;
		y: string | number | Date | null;
	};

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) return undefined;
		// Metric mode fills these at runtime; raw mode requires them by validation.
		// Guard so the derivation never passes undefined through to the query builder.
		if (!tableName || !xProcessed || !yProcessed) return undefined;

		return {
			tableExpressionName: tableName,
			columns: [xProcessed, yProcessed],
			filterIds,
			where,
			date_range: resolvedDateRange,
			having,
			qualify,
			order: order || xColumn,
			limit
		};
	});
	const autoRefreshCtx = getAutoRefreshContext();
	const query = new Query<Row>(
		() => queryConfig,
		{
			connection,
			filterContexts: [repeatFilters, pageFilters],
			inlineQueries,
			projectSettings: getProjectSettingsContext(),
			defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
		},
		{ refreshInterval: () => props.refresh_interval }
	);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'sparkline', query);
	});

	// Extract the result and transform it for echarts
	let chartData = $state<Array<[string | Date, number]>>([]);
	const error = $derived(query.error);
	const loading = $derived(metadata.loading || query.loading);

	$effect(() => {
		setError(error ?? undefined);
	});

	// Process the query results
	$effect(() => {
		if (!query.result?.rows) return;
		if (!xColumn || !yColumn) return;

		// Transform the data for ECharts
		const processedData: Array<[string | Date, number]> = [];

		for (const row of query.result.rows) {
			// Use the extracted column aliases to access row data
			const rowData = row as Record<string, string | number | Date | null>;
			const xValue = rowData[xColumn];
			if (xValue === null || xValue === undefined) continue;

			// Ensure x is either a Date object or a string
			const processedXValue =
				xValue instanceof Date
					? xValue
					: typeof xValue === 'number'
						? new Date(xValue)
						: String(xValue);

			const yValue =
				typeof rowData[yColumn] === 'number'
					? rowData[yColumn]
					: Number.parseFloat(String(rowData[yColumn]));
			if (Number.isNaN(yValue)) continue;

			processedData.push([processedXValue, yValue]);
		}

		// Sort data by x-axis value if it's a date
		if (xEChartsType === 'time') {
			processedData.sort((a, b) => {
				const aDate = a[0] instanceof Date ? a[0].getTime() : new Date(String(a[0])).getTime();
				const bDate = b[0] instanceof Date ? b[0].getTime() : new Date(String(b[0])).getTime();
				return aDate - bDate;
			});
		}

		chartData = processedData;
	});
</script>

<SparklineDisplay
	{chartData}
	{type}
	{color}
	{y_fmt}
	x_fmt={effectiveXFmt}
	{fit_to_data}
	{interactive}
	{width}
	{height}
	{xEChartsType}
	{loading}
	group={props.connect_group}
/>
