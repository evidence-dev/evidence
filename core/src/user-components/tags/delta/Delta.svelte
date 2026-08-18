<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import DeltaDisplay from './DeltaDisplay.svelte';
	import {
		ComparisonTooltip,
		setComparisonTooltipContext
	} from '../../common/comparison-tooltips/ComparisonTooltip.svelte';
	import { useComparisonTooltip } from '../../common/comparison-tooltips/useComparisonTooltip';
	import GlobalComparisonTooltip from '../../common/comparison-tooltips/GlobalComparisonTooltip.svelte';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { DeltaModel } from './DeltaModel.svelte';
	import { getModelContext } from '../../model-context.svelte';

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	// Define the props type
	type Props = UserComponentProps<typeof schema>;

	const props: Props = $props();

	const model = getModelContext({ expected: DeltaModel });
	const query = $derived(model.query);
	const loading = $derived(query.loading);

	const fmt = $derived(model.resolvedFmt);
	const text = $derived(model.resolvedText);
	const comparison = $derived(model.resolvedComparison);
	const chip = $derived(props.chip ?? false);
	const downIsGood = $derived(comparison?.down_is_good ?? false);
	const showValue = $derived(props.show_value ?? true);
	const showSymbol = $derived(props.show_symbol ?? true);
	const symbolPosition = $derived(props.symbol_position ?? 'right');
	const neutralRange = $derived((props.neutral_range ?? [0, 0]) as (number | null)[]);

	// Set up comparison tooltip context
	const comparisonTooltip = new ComparisonTooltip();
	setComparisonTooltipContext(comparisonTooltip);

	const valueProcessed = $derived(model.valueProcessed);
	const comparisonId = $derived(model.comparisonId);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'delta', query);
	});

	// Extract and process result
	const resultRow = $derived.by(() => {
		if (!query.result?.rows?.[0]) return null;
		return query.result.rows[0];
	});

	// Tooltip handlers
	const { createTooltipHandlers } = useComparisonTooltip();
	const comparisonTooltipHandlers = $derived.by(() =>
		createTooltipHandlers(
			comparison,
			resultRow || {},
			query.result?.rows,
			undefined,
			undefined,
			comparisonId ?? undefined,
			valueProcessed.alias,
			undefined,
			false,
			fmt // user's format for customFormat parameter
		)
	);

	const mainResult = $derived.by(() => {
		if (!resultRow) return undefined;
		return resultRow[valueProcessed.alias];
	});

	// Calculate delta value from comparison based on display_type
	const deltaValue = $derived.by(() => {
		if (!resultRow || !comparisonId) return mainResult;

		const displayType = comparison?.display_type ?? 'pct';
		const columnSuffix =
			displayType === 'compared_value'
				? '_compared_value'
				: displayType === 'abs'
					? '_abs'
					: '_pct';

		const comparisonValue = resultRow[`${comparisonId}${columnSuffix}`];
		return comparisonValue !== null && comparisonValue !== undefined ? comparisonValue : mainResult;
	});

	// Determine format based on display type
	const deltaFormat = $derived.by(() => {
		if (!comparison?.compare_vs) return fmt;
		const displayType = comparison?.display_type ?? 'pct';

		if (displayType === 'pct') {
			return comparison.pct_fmt || 'pct';
		} else if (displayType === 'compared_value') {
			return fmt;
		} else {
			return comparison.abs_fmt || fmt || 'num0';
		}
	});

	const error = $derived(query.error);

	$effect(() => {
		setError(error ?? undefined);
	});

	setupRenderReadiness('delta', () => !loading);
</script>

{#if loading}
	<LoaderCircle class="text-muted-foreground inline h-3 w-3 animate-spin [animation-duration:1s]" />
{:else if comparison && comparison.compare_vs}
	<span {...comparisonTooltipHandlers} class="inline-block cursor-help">
		<DeltaDisplay
			value={deltaValue}
			fmt={deltaFormat}
			{text}
			{chip}
			{downIsGood}
			{showValue}
			{showSymbol}
			{symbolPosition}
			{neutralRange}
		/>
	</span>
{:else}
	<DeltaDisplay
		value={deltaValue}
		fmt={deltaFormat}
		{text}
		{chip}
		{downIsGood}
		{showValue}
		{showSymbol}
		{symbolPosition}
		{neutralRange}
	/>
{/if}

<GlobalComparisonTooltip />
