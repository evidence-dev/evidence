<script lang="ts">
	import SparklineDisplay from '../sparkline/SparklineDisplay.svelte';
	import { cn } from '../../../shadcn/utils';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { formatValue } from '../../formatValue';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import Info from '../info/Info.svelte';
	import {
		ComparisonTooltip,
		setComparisonTooltipContext
	} from '../../common/comparison-tooltips/ComparisonTooltip.svelte';
	import { useComparisonTooltip } from '../../common/comparison-tooltips/useComparisonTooltip';
	import GlobalComparisonTooltip from '../../common/comparison-tooltips/GlobalComparisonTooltip.svelte';
	import DeltaDisplay from '../delta/DeltaDisplay.svelte';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { BigValueModel } from './BigValueModel.svelte';
	import { getModelContext } from '../../model-context.svelte';
	import { coerceBoolean } from '../../common/process-variables';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { browser } from '../../../shims/env';
	import { getRendererContext } from '../../Renderer/renderer-context';
	import {
		isInternalLink,
		transformInternalLink,
		mergeCurrentSearchParams
	} from '../../common/transform-internal-link';
	import { page } from '$app/state';

	// Define interface for query results that's compatible with AnyRowType
	interface QueryResult {
		value?: number;
		result?: number | string;
		// sparkline_data is accessed via index signature as Array<[string | Date | number, number]>
		[key: string]: string | number | Date | null | undefined;
	}

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	// Define the props type
	type Props = UserComponentProps<typeof schema>;

	const props: Props = $props();

	const model = getModelContext({ expected: BigValueModel });
	const query = $derived(model.query);
	const loading = $derived(query.loading);

	// Use resolved comparison and sparkline from model (handles variable interpolation)
	const comparison = $derived(model.resolvedComparison);
	// Coerce booleans in case they came from variable interpolation as strings
	const comparison_delta = $derived(coerceBoolean(comparison?.delta) ?? true);
	const sparkline = $derived(model.resolvedSparkline);
	const sparkline_type = $derived((sparkline?.type ?? 'line') as 'line' | 'area' | 'bar');
	const sparkline_color = $derived(sparkline?.color);
	const sparkline_y_fmt = $derived(sparkline?.y_fmt ?? model.resolvedFmt);
	const sparkline_x_fmt = $derived(sparkline?.x_fmt);
	const sparkline_fit_to_data = $derived(coerceBoolean(sparkline?.fit_to_data) ?? false);
	const fmt = $derived(model.resolvedFmt);
	// Derive comparison display text:
	// 1. Use explicit 'text' if provided
	// 2. Use 'name' from custom comparison (e.g., "vs. Franchisees")
	// 3. Fall back to default text based on compare_vs type
	const comparison_text = $derived(
		comparison?.text ||
			comparison?.name ||
			(comparison?.compare_vs === 'prior year'
				? 'vs. last year'
				: comparison?.compare_vs === 'prior period'
					? 'vs. last period'
					: comparison?.compare_vs === 'target'
						? 'vs. target'
						: comparison?.compare_vs === 'benchmark'
							? 'vs. benchmark'
							: '')
	);
	const down_is_good = $derived(coerceBoolean(comparison?.down_is_good));
	const neutralRange = $derived(comparison?.neutral_range ?? [0, 0]);
	const max_width = $derived(props.max_width ?? 'none');
	const min_width = $derived(props.min_width ?? 'auto');
	const title_class = $derived(props.title_class);
	const value_class = $derived(props.value_class);
	const text_size = $derived(props.text_size);
	const comparison_class = $derived(undefined);
	const class_name = $derived(props.class_name);

	let rendererContext: ReturnType<typeof getRendererContext> | undefined;
	try {
		rendererContext = getRendererContext();
	} catch {
		rendererContext = undefined;
	}
	const link = $derived(model.resolvedLink);
	const linkIsInternal = $derived(link ? isInternalLink(link) : false);
	const transformedLink = $derived(
		link
			? transformInternalLink(link, rendererContext?.context, page.params, {
					hrefIncludesProjectSlug: false
				})
			: undefined
	);

	function handleInternalLinkClick(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (!transformedLink) return;
		const merged = mergeCurrentSearchParams(transformedLink);
		if (merged !== transformedLink) {
			e.currentTarget.href = merged;
		}
	}

	// Map text_size to Tailwind classes and corresponding loader sizes
	// Classes are explicitly listed to ensure Tailwind includes them in the build
	const textSizeConfig = $derived.by(() => {
		switch (text_size) {
			case 'sm':
				return { textClass: 'text-sm', loaderClass: 'h-3.5 w-3.5' };
			case 'base':
				return { textClass: 'text-base', loaderClass: 'h-4 w-4' };
			case 'lg':
				return { textClass: 'text-lg', loaderClass: 'h-4.5 w-4.5' };
			case '2xl':
				return { textClass: 'text-2xl', loaderClass: 'h-6 w-6' };
			case '3xl':
				return { textClass: 'text-3xl', loaderClass: 'h-7 w-7' };
			case '4xl':
				return { textClass: 'text-4xl', loaderClass: 'h-9 w-9' };
			case '5xl':
				return { textClass: 'text-5xl', loaderClass: 'h-12 w-12' };
			case 'xl':
			default:
				// Default: text-xl (current behavior)
				return { textClass: 'text-xl', loaderClass: 'h-5 w-5' };
		}
	});

	// Set up comparison tooltip context
	const comparisonTooltip = new ComparisonTooltip();
	setComparisonTooltipContext(comparisonTooltip);

	const valueProcessed = $derived(model.valueProcessed);
	const comparisonId = $derived(model.comparisonId);
	const sparklineId = $derived(model.sparklineId);

	// Use resolved props from model (handles variable interpolation)
	const resolvedTitle = $derived(model.resolvedTitle);
	const info = $derived(model.resolvedInfo);
	const info_link = $derived(model.resolvedInfo_link);
	const info_link_title = $derived(model.resolvedInfo_link_title);

	const title = $derived(resolvedTitle || (props.value ? valueProcessed.displayAlias : ''));

	// Extract data points from the single-row query results
	const resultRow = $derived.by(() => {
		if (!query.result?.rows?.[0]) return null;
		return query.result.rows[0] as QueryResult;
	});

	// Tooltip: create handlers that will be spread onto the comparison element
	const { createTooltipHandlers } = useComparisonTooltip();
	const comparisonTooltipHandlers = $derived.by(() =>
		createTooltipHandlers(
			comparison,
			resultRow || {},
			query.result?.rows,
			undefined, // dimensionFields
			undefined, // pivotFields
			comparisonId ?? undefined,
			valueProcessed.alias,
			undefined, // currentColumnKey
			false, // measures_first
			fmt // user's format for customFormat parameter
		)
	);

	const error = $derived(query.error);

	// Track error state
	$effect(() => {
		setError(error ?? undefined);
	});

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'big_value', query, title);
	});

	// Extract main value
	const mainResult = $derived.by(() => {
		if (!resultRow) return undefined;
		return resultRow[valueProcessed.alias];
	});

	const columnType = $derived(
		query.result?.columns?.find((c) => c.name === valueProcessed.alias)?.jsType
	);

	// Format main value
	const formattedMainResult = $derived(
		mainResult !== null && mainResult !== undefined
			? formatValue(mainResult, fmt, undefined, undefined, columnType)
			: '-'
	);

	const numericMain = $derived(
		typeof mainResult === 'number' && Number.isFinite(mainResult) ? mainResult : null
	);
	const valueTween = new Tween(0, { duration: 400, easing: cubicOut });
	let tweenStarted = false;
	$effect(() => {
		const v = numericMain;
		if (v === null) {
			tweenStarted = false;
			return;
		}
		if (!tweenStarted) {
			valueTween.set(v, { duration: 0 });
			tweenStarted = true;
		} else {
			valueTween.set(v, prefersReducedMotion.current ? { duration: 0 } : undefined);
		}
	});
	const displayValue = $derived(
		browser && tweenStarted && numericMain !== null
			? formatValue(valueTween.current, fmt, undefined, undefined, columnType)
			: formattedMainResult
	);

	// Determine the comparison value to use based on display_type
	const comparisonValueForDisplay = $derived.by(() => {
		if (!resultRow || !comparisonId) return null;

		const displayType = comparison?.display_type ?? 'pct';
		const columnSuffix =
			displayType === 'compared_value'
				? '_compared_value'
				: displayType === 'abs'
					? '_abs'
					: '_pct';

		const comparisonValue = resultRow[`${comparisonId}${columnSuffix}`];
		return comparisonValue !== null && comparisonValue !== undefined ? comparisonValue : null;
	});

	// Determine the format to use based on display_type
	const comparisonDisplayFormat = $derived.by(() => {
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

	// Extract sparkline data from sparkline system
	const sparklineData = $derived.by(() => {
		if (!sparkline || !resultRow || !sparklineId) return null;

		// ClickHouse returns sparkline data as arrays in regular columns
		// Cast to unknown since AnyRowType doesn't include arrays
		const sparklineRaw = resultRow[sparklineId] as unknown;
		if (!Array.isArray(sparklineRaw)) return null;

		return sparklineRaw.map(([x, y]: [string | Date | number, number]) => {
			// Ensure x is either string or Date for SparklineDisplay compatibility
			const processedX = x instanceof Date ? x : typeof x === 'number' ? new Date(x) : String(x);
			return [processedX, typeof y === 'number' ? y : Number(y) || 0] as [string | Date, number];
		});
	});

	setupRenderReadiness('bigvalue', () => !loading);
</script>

<span
	class={cn('block px-0 py-2 font-sans', class_name)}
	style={`
		min-width: ${min_width};
		max-width: ${max_width};
		box-sizing: border-box;
	`}
>
	<span class={cn('block w-full text-left text-sm leading-none', title_class)}>
		{#if link && transformedLink}
			<a
				href={transformedLink}
				target={linkIsInternal ? undefined : '_blank'}
				rel={linkIsInternal ? undefined : 'noopener noreferrer'}
				onclick={linkIsInternal ? handleInternalLinkClick : undefined}
				class="text-(--theme-table-link) no-underline hover:underline"
			>
				{title}
			</a>
		{:else}
			{title}
		{/if}
		{#if info}
			<Info text={info} link={info_link} link_title={info_link_title} />
		{/if}
	</span>

	<span
		class={cn(
			'relative mt-2 flex w-full items-center text-left leading-none font-medium',
			textSizeConfig.textClass,
			value_class
		)}
	>
		<span class="inline-flex items-center">
			{#if loading}
				<span class="inline">
					<LoaderCircle
						class={cn(
							'text-muted-foreground inline-block animate-spin [animation-duration:1s]',
							textSizeConfig.loaderClass
						)}
					/>
				</span>
			{:else}
				<span class="inline">{displayValue}</span>
			{/if}

			{#if sparkline && sparklineData}
				<span class="ml-1">
					<SparklineDisplay
						chartData={sparklineData}
						type={sparkline_type}
						color={sparkline_color}
						y_fmt={sparkline_y_fmt}
						x_fmt={sparkline_x_fmt}
						fit_to_data={sparkline_fit_to_data}
						interactive={true}
						class_name=""
						width={50}
						height={15}
						xEChartsType="time"
						loading={false}
					/>
				</span>
			{/if}
		</span>
	</span>

	{#if comparison}
		<span
			{...comparisonTooltipHandlers}
			class={cn('mt-1.75 flex w-full cursor-help items-center text-left text-xs', comparison_class)}
		>
			{#if comparison_delta}
				<DeltaDisplay
					value={comparisonValueForDisplay}
					fmt={comparisonDisplayFormat}
					text={comparison_text}
					downIsGood={down_is_good}
					{neutralRange}
					symbolPosition="left"
					className="text-xs"
				/>
			{:else}
				<span class="inline">
					{comparisonValueForDisplay !== null && comparisonValueForDisplay !== undefined
						? formatValue(comparisonValueForDisplay, comparisonDisplayFormat)
						: '-'}
				</span>
				<span class="ml-1">{comparison_text}</span>
			{/if}
		</span>
	{/if}

	<GlobalComparisonTooltip />
</span>
