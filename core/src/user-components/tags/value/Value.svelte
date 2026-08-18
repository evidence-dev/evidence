<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { formatValue } from '../../formatValue';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import Info from '../info/Info.svelte';
	import {
		ComparisonTooltip,
		setComparisonTooltipContext
	} from '../../common/comparison-tooltips/ComparisonTooltip.svelte';
	import { useComparisonTooltip } from '../../common/comparison-tooltips/useComparisonTooltip';
	import GlobalComparisonTooltip from '../../common/comparison-tooltips/GlobalComparisonTooltip.svelte';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { ValueModel } from './ValueModel.svelte';
	import { getModelContext } from '../../model-context.svelte';

	const { getComponentId, setError /*hasBlockingErrors*/ } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());

	const queryInfoContext = getQueryInfoContext();

	// Define the props type
	type Props = UserComponentProps<typeof schema>;

	const props: Props = $props();

	const className = $derived(props.className);
	const fmt = $derived(props.fmt);
	const color = $derived(props.color);
	const redNegatives = $derived(props.redNegatives ?? false);

	const model = getModelContext({ expected: ValueModel });
	const info = $derived(model.resolvedInfo);
	const info_link = $derived(model.resolvedInfo_link);
	const info_link_title = $derived(model.resolvedInfo_link_title);
	const comparison = $derived(model.resolvedComparison);
	const query = $derived(model.query);
	const loading = $derived(query.loading);

	setupRenderReadiness('value', () => !loading);

	// Set up comparison tooltip context
	const comparisonTooltip = new ComparisonTooltip();
	setComparisonTooltipContext(comparisonTooltip);

	const valueProcessed = $derived(model.valueProcessed);
	const comparisonId = $derived(model.comparisonId);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'value', query);
	});

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

	// Calculate display value based on comparison display_type
	const displayValue = $derived.by(() => {
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

	const error = $derived(query.error);

	$effect(() => {
		setError(error ?? undefined);
	});

	// Determine format based on display type
	const displayFormat = $derived.by(() => {
		if (!comparison || !comparison.compare_vs) return fmt;
		const displayType = comparison.display_type ?? 'pct';

		if (displayType === 'pct') {
			return comparison.pct_fmt || 'pct';
		} else if (displayType === 'compared_value') {
			return fmt;
		} else {
			return comparison.abs_fmt || fmt || 'num0';
		}
	});

	const columnType = $derived(
		query.result?.columns?.find((c) => c.name === valueProcessed.alias)?.jsType
	);

	// Format the display value
	const formattedResult = $derived(
		displayValue !== undefined
			? formatValue(displayValue, displayFormat, undefined, undefined, columnType)
			: '–'
	);

	// Determine the final color to use
	const finalColor = $derived.by(() => {
		// If redNegatives is true and the result is a negative number, use red
		if (
			redNegatives &&
			displayValue !== undefined &&
			typeof displayValue === 'number' &&
			displayValue < 0
		) {
			return 'var(--theme-negative, rgb(220 38 38))';
		}
		// Otherwise use the color prop if provided
		return color;
	});

	// Determine if we should show the loading indicator
	const showLoading = $derived(loading);

	// Determine if we have a valid value to display
	const hasValidValue = $derived(displayValue !== undefined);
</script>

{#if comparison && comparison.compare_vs}
	<span
		{...comparisonTooltipHandlers}
		class="{className} inline cursor-help"
		style={finalColor ? `color: ${finalColor}` : undefined}
	>
		{#if showLoading}
			<LoaderCircle
				class="text-muted-foreground inline-block h-3 w-3 animate-spin [animation-duration:1s]"
			/>
		{:else if !hasValidValue}
			<span class="inline font-sans">–</span>
		{:else}
			{formattedResult}
		{/if}
		{#if info}
			<Info text={info} link={info_link} link_title={info_link_title} />
		{/if}
	</span>
{:else}
	<span class="{className} inline" style={finalColor ? `color: ${finalColor}` : undefined}>
		{#if showLoading}
			<LoaderCircle
				class="text-muted-foreground inline-block h-3 w-3 animate-spin [animation-duration:1s]"
			/>
		{:else if !hasValidValue}
			<span class="inline font-sans">–</span>
		{:else}
			{formattedResult}
		{/if}
		{#if info}
			<Info text={info} link={info_link} link_title={info_link_title} />
		{/if}
	</span>
{/if}

<GlobalComparisonTooltip />
