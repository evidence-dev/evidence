<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import type { Filter } from '../../../Filter.svelte';
	import { Slider } from '../../../shadcn/components/ui/slider';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { Label } from '../../../shadcn/components/ui/label';
	import { Skeleton } from '../../../shadcn/components/ui/skeleton';
	import { Input } from '../../../shadcn/components/ui/input';
	import formatTitle from '../../formatTitle';
	import { formatValue } from '../../formatValue';
	import Info from '../info/Info.svelte';
	import Ellipsis from '../../../viewer-components/Ellipsis.svelte';
	import { Query } from '../../../Query.svelte';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	const props: UserComponentProps<typeof schema> = $props();

	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const connection = getDefaultConnection();
	const queryInfoContext = getQueryInfoContext();
	const inlineQueries = getInlineQueriesContext();
	const { getComponentId, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const hasValidationErrors = $derived(hasBlockingErrors());

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn, resolveNumber } = $derived(
		createResolvers(variableProcessor)
	);

	// Resolved props
	const id = $derived(props.id);
	const title = $derived(resolveText(props.title));
	const info = $derived(resolveText(props.info));
	const info_link = $derived(resolveText(props.info_link));
	const info_link_title = $derived(resolveText(props.info_link_title));
	const data = $derived(resolveText(props.data));
	const valueColumn = $derived(resolveColumn(props.value_column));
	const userMin = $derived(resolveNumber(props.min));
	const userMax = $derived(resolveNumber(props.max));
	const userStep = $derived(resolveNumber(props.step) ?? 1);
	const safeStep = $derived.by(() => (Number.isFinite(userStep) && userStep > 0 ? userStep : 1));
	const snapToStep = $derived(props.snap_to_step ?? true);
	const fmt = $derived(resolveText(props.fmt) ?? 'num');
	const range = $derived(props.range ?? false);
	const showInput = $derived(props.show_input ?? false);
	const resolvedDateRange = $derived.by(() => {
		if (!props.date_range) return undefined;
		return {
			...props.date_range,
			range: resolveText(props.date_range.range)
		};
	});

	// Query for min/max values when data and value are provided
	const rangeQueryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}

		// Only run query if we have both data and value_column
		if (!data || !valueColumn) {
			return;
		}

		const valueProcessed = processColumnExpression(
			{
				value: valueColumn
			},
			connection.dialect
		);

		const minColumn = processColumnExpression(
			{
				value: `MIN(${valueProcessed.sqlWithoutAlias}) AS min_value`,
				type: 'measure'
			},
			connection.dialect
		);
		const maxColumn = processColumnExpression(
			{
				value: `MAX(${valueProcessed.sqlWithoutAlias}) AS max_value`,
				type: 'measure'
			},
			connection.dialect
		);

		return {
			tableExpressionName: data,
			columns: [minColumn, maxColumn],
			where: `${valueProcessed.sqlWithoutAlias} IS NOT NULL`,
			date_range: resolvedDateRange
		};
	});

	const rangeQuery = new Query<{ min_value: number; max_value: number }>(() => rangeQueryConfig, {
		connection,
		filterContexts: [pageFilters],
		inlineQueries,
		projectSettings: getProjectSettingsContext(),
		defaultRefreshInterval: undefined
	});

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'slider', rangeQuery, title);
	});

	// Only consider it loading if we actually have a query to run
	const loading = $derived(data && valueColumn ? rangeQuery.loading : false);
	setupRenderReadiness('slider', () => !loading);

	// Use query results as default min/max, but allow user override
	// Query results come back as strings — must cast to numbers for math and shadcn Slider props
	const queryResult = $derived(rangeQuery.result?.rows?.[0]);
	const queryMin = $derived(
		queryResult?.min_value != null ? Number(queryResult.min_value) : undefined
	);
	const queryMax = $derived(
		queryResult?.max_value != null ? Number(queryResult.max_value) : undefined
	);

	// Calculate base min/max from user input or query results
	const baseMin = $derived(userMin !== undefined ? userMin : queryMin !== undefined ? queryMin : 0);
	const baseMax = $derived(
		userMax !== undefined ? userMax : queryMax !== undefined ? queryMax : 100
	);

	// Apply snap_to_step: round min/max to step boundaries for cleaner numbers
	const min = $derived.by(() => {
		if (!snapToStep || safeStep === 1) return baseMin;
		// Only snap if the value came from a query (not user-provided)
		if (userMin !== undefined) return baseMin;
		// Floor to nearest step boundary
		return Math.floor(baseMin / safeStep) * safeStep;
	});

	const max = $derived.by(() => {
		if (!snapToStep || safeStep === 1) return baseMax;
		// Only snap if the value came from a query (not user-provided)
		if (userMax !== undefined) return baseMax;
		// Ceil to nearest step boundary
		return Math.ceil(baseMax / safeStep) * safeStep;
	});

	// Auto-adjust step for large ranges to prevent performance issues
	// Limit to ~1000 discrete positions max
	// If range > 1000 and user's step is too small, use minimum step needed
	const sliderTicks = $derived(max - min);
	const minStep = $derived(sliderTicks / 1000);
	const step = $derived(sliderTicks > 1000 && safeStep < minStep ? minStep : safeStep);

	type SliderValue = number | [number, number];
	let filter: Filter<SliderValue> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<SliderValue> | undefined) : undefined
	);

	// Ensure filter always has a value (default to min for single, [min, max] for range)
	// Only set default if no value exists and we're not loading
	$effect(() => {
		if (!filter || loading) return;

		const currentMin = min;
		const currentMax = max;

		if (filter.value === undefined || filter.value === null) {
			if (range) {
				filter.setDefault([currentMin, currentMax] as [number, number]);
			} else {
				filter.setDefault(currentMin);
			}
			return;
		}

		// Snap filter value to min/max if it's outside the range (e.g., from URL param)
		if (range && Array.isArray(filter.value)) {
			const clampedMin = Math.max(currentMin, Math.min(currentMax, filter.value[0]));
			const clampedMax = Math.max(currentMin, Math.min(currentMax, filter.value[1]));
			const finalRange: [number, number] = [
				Math.min(clampedMin, clampedMax),
				Math.max(clampedMin, clampedMax)
			];

			if (filter.value[0] !== finalRange[0] || filter.value[1] !== finalRange[1]) {
				filter.value = finalRange;
			}
		} else if (!range && typeof filter.value === 'number') {
			if (filter.value < currentMin || filter.value > currentMax) {
				const clamped = Math.max(currentMin, Math.min(currentMax, filter.value));
				filter.value = clamped;
			}
		}
	});

	// Format values using fmt prop
	const formattedSliderValue = $derived.by(() => {
		if (!filter || filter.value === undefined || filter.value === null) return '';
		if (range && Array.isArray(filter.value)) {
			return `${formatValue(filter.value[0], fmt)} - ${formatValue(filter.value[1], fmt)}`;
		} else if (!range && typeof filter.value === 'number') {
			return formatValue(filter.value, fmt);
		}
		return '';
	});
	const formattedMin = $derived(formatValue(min, fmt));
	const formattedMax = $derived(formatValue(max, fmt));

	// Input state for direct editing
	let inputValue = $state<string>('');
	let inputMinValue = $state<string>('');
	let inputMaxValue = $state<string>('');
	let isInputFocused = $state<boolean>(false);
	let isMinInputFocused = $state<boolean>(false);
	let isMaxInputFocused = $state<boolean>(false);

	// Calculate input widths based on content (with minimal padding)
	const inputValueWidth = $derived.by(() => {
		const length = inputValue.length || 1;
		// Add small amount of space for cursor
		return Math.max(3, Math.min(length + 0.5, 20));
	});
	const inputMinWidth = $derived.by(() => {
		const length = inputMinValue.length || 1;
		return Math.max(3, Math.min(length + 0.5, 20));
	});
	const inputMaxWidth = $derived.by(() => {
		const length = inputMaxValue.length || 1;
		return Math.max(3, Math.min(length + 0.5, 20));
	});

	// Sync input values from filter value (only when not focused)
	// Also update display value based on focus state
	$effect(() => {
		if (!filter || !showInput) return;

		if (range && Array.isArray(filter.value)) {
			if (!isMinInputFocused) {
				inputMinValue = formatValue(filter.value[0], fmt);
			}
			if (!isMaxInputFocused) {
				inputMaxValue = formatValue(filter.value[1], fmt);
			}
		} else if (!range && typeof filter.value === 'number') {
			if (!isInputFocused) {
				inputValue = formatValue(filter.value, fmt);
			}
		}
	});

	// Handle input focus - show raw number
	function handleInputFocus() {
		if (!filter) return;
		isInputFocused = true;
		if (!range && typeof filter.value === 'number') {
			inputValue = String(filter.value);
		}
	}

	function handleMinInputFocus() {
		if (!filter || !range) return;
		isMinInputFocused = true;
		if (Array.isArray(filter.value)) {
			inputMinValue = String(filter.value[0]);
		}
	}

	function handleMaxInputFocus() {
		if (!filter || !range) return;
		isMaxInputFocused = true;
		if (Array.isArray(filter.value)) {
			inputMaxValue = String(filter.value[1]);
		}
	}

	// Handle input blur - parse, validate, format
	function handleInputBlur() {
		if (!filter) return;
		isInputFocused = false;

		const num = Number(inputValue);

		if (!isNaN(num)) {
			const clamped = Math.max(min, Math.min(max, num));
			filter.value = clamped;
			// Format the display value according to fmt
			inputValue = formatValue(clamped, fmt);
		} else {
			// Reset to current filter value if invalid
			if (typeof filter.value === 'number') {
				inputValue = formatValue(filter.value, fmt);
			}
		}
	}

	function handleMinInputBlur() {
		if (!filter || !range) return;
		isMinInputFocused = false;

		const minNum = Number(inputMinValue);

		if (!isNaN(minNum)) {
			const clampedMin = Math.max(min, Math.min(max, minNum));
			if (Array.isArray(filter.value)) {
				const clampedMax = Math.max(min, Math.min(max, filter.value[1]));
				const finalRange: [number, number] = [
					Math.min(clampedMin, clampedMax),
					Math.max(clampedMin, clampedMax)
				];
				filter.value = finalRange;
				// Format the display value according to fmt
				inputMinValue = formatValue(finalRange[0], fmt);
			}
		} else {
			// Reset to current filter value if invalid
			if (Array.isArray(filter.value)) {
				inputMinValue = formatValue(filter.value[0], fmt);
			}
		}
	}

	function handleMaxInputBlur() {
		if (!filter || !range) return;
		isMaxInputFocused = false;

		const maxNum = Number(inputMaxValue);

		if (!isNaN(maxNum)) {
			const clampedMax = Math.max(min, Math.min(max, maxNum));
			if (Array.isArray(filter.value)) {
				const clampedMin = Math.max(min, Math.min(max, filter.value[0]));
				const finalRange: [number, number] = [
					Math.min(clampedMin, clampedMax),
					Math.max(clampedMin, clampedMax)
				];
				filter.value = finalRange;
				// Format the display value according to fmt
				inputMaxValue = formatValue(finalRange[1], fmt);
			}
		} else {
			// Reset to current filter value if invalid
			if (Array.isArray(filter.value)) {
				inputMaxValue = formatValue(filter.value[1], fmt);
			}
		}
	}

	// Handle input changes - update slider in real-time while typing
	function handleInputChange() {
		if (!filter) return;

		const num = Number(inputValue);

		if (!isNaN(num)) {
			const clamped = Math.max(min, Math.min(max, num));
			filter.value = clamped;
		}
	}

	function handleMinInputChange() {
		if (!filter || !range) return;

		const minNum = Number(inputMinValue);

		if (!isNaN(minNum)) {
			const clampedMin = Math.max(min, Math.min(max, minNum));
			if (Array.isArray(filter.value)) {
				const clampedMax = Math.max(min, Math.min(max, filter.value[1]));
				const finalRange: [number, number] = [
					Math.min(clampedMin, clampedMax),
					Math.max(clampedMin, clampedMax)
				];
				filter.value = finalRange;
			}
		}
	}

	function handleMaxInputChange() {
		if (!filter || !range) return;

		const maxNum = Number(inputMaxValue);

		if (!isNaN(maxNum)) {
			const clampedMax = Math.max(min, Math.min(max, maxNum));
			if (Array.isArray(filter.value)) {
				const clampedMin = Math.max(min, Math.min(max, filter.value[0]));
				const finalRange: [number, number] = [
					Math.min(clampedMin, clampedMax),
					Math.max(clampedMin, clampedMax)
				];
				filter.value = finalRange;
			}
		}
	}
</script>

{#if title !== undefined || id}
	<Label
		for={id}
		class="mb-[12.5px] flex w-64 items-baseline justify-between gap-2"
		style="min-height: 1.25rem;"
	>
		{#if loading}
			<span class="truncate">
				{#if title !== undefined && title !== ''}
					{title}: <Skeleton class="inline-block h-[1em] w-8" />
				{:else if title === ''}
					<Skeleton class="inline-block h-[1em] w-8" />
				{:else}
					{formatTitle(id)}: <Skeleton class="inline-block h-[1em] w-8" />
				{/if}
			</span>
		{:else}
			{#if title !== undefined && title !== ''}
				<Ellipsis class="truncate leading-[1.25rem]">
					{title}:
				</Ellipsis>
			{:else if title === ''}
				<span class="truncate leading-[1.25rem]"></span>
			{:else}
				<Ellipsis class="truncate leading-[1.25rem]">
					{formatTitle(id)}:
				</Ellipsis>
			{/if}
			<span class="flex flex-shrink-0 items-baseline gap-1">
				{#if showInput}
					{#if range}
						<span class="inline-flex items-baseline gap-1 font-normal">
							<Input
								type="text"
								bind:value={inputMinValue}
								size={inputMinWidth}
								oninput={handleMinInputChange}
								onfocus={handleMinInputFocus}
								onblur={handleMinInputBlur}
								ondblclick={(e) => e.currentTarget.select()}
								class="!flex h-5 min-w-8 rounded-sm py-0 pr-0.5 pl-1 text-xs !select-text"
								style="line-height: 1.25rem; margin-top: -0.125rem; width: {inputMinWidth}ch; user-select: text;"
							/>
							<span class="leading-[1.25rem] select-none">-</span>
							<Input
								type="text"
								bind:value={inputMaxValue}
								size={inputMaxWidth}
								oninput={handleMaxInputChange}
								onfocus={handleMaxInputFocus}
								onblur={handleMaxInputBlur}
								ondblclick={(e) => e.currentTarget.select()}
								class="!flex h-5 min-w-8 rounded-sm py-0 pr-0.5 pl-1 text-xs !select-text"
								style="line-height: 1.25rem; margin-top: -0.125rem; width: {inputMaxWidth}ch; user-select: text;"
							/>
						</span>
					{:else}
						<Input
							type="text"
							bind:value={inputValue}
							size={inputValueWidth}
							oninput={handleInputChange}
							onfocus={handleInputFocus}
							onblur={handleInputBlur}
							ondblclick={(e) => e.currentTarget.select()}
							class="!flex h-5 min-w-8 rounded-sm py-0 pr-0.5 pl-1 text-xs font-normal !select-text"
							style="line-height: 1.25rem; margin-top: -0.125rem; width: {inputValueWidth}ch; user-select: text;"
						/>
					{/if}
				{:else}
					<span class="leading-[1.25rem] font-normal">{formattedSliderValue}</span>
				{/if}
				{#if info}
					<Info text={info} link={info_link} link_title={info_link_title} className="-mb-0.5" />
				{/if}
			</span>
		{/if}
	</Label>
{/if}

{#if filter}
	<div class="relative mb-4 flex items-end">
		{#if loading}
			<!-- Slider skeleton -->
			<div class="relative w-64">
				<div class="flex items-center">
					<Skeleton class="h-1.5 w-full rounded-full" />
				</div>
				<div class="text-muted-foreground mt-1.5 flex justify-between text-xs">
					<Skeleton class="h-3 w-12" />
					<Skeleton class="h-3 w-12" />
				</div>
			</div>
		{:else}
			<div class="relative w-64">
				{#if range}
					<Slider
						bind:value={
							() => {
								// Range mode
								if (
									filter?.value === undefined ||
									filter?.value === null ||
									!Array.isArray(filter.value)
								) {
									// Initialize to full range
									return [min, max] as [number, number];
								}
								// During loading, preserve the filter value even if it's outside fallback range
								if (loading) return filter.value;
								// Clamp both values
								const clampedMin = Math.max(min, Math.min(max, filter.value[0]));
								const clampedMax = Math.max(min, Math.min(max, filter.value[1]));
								return [Math.min(clampedMin, clampedMax), Math.max(clampedMin, clampedMax)] as [
									number,
									number
								];
							},
							(newValue: [number, number]) => {
								if (!filter) return;
								// During loading, don't clamp - wait for real min/max values
								if (loading) {
									filter.value = newValue;
									return;
								}
								// Range mode: clamp both values
								const clampedMin = Math.max(min, Math.min(max, newValue[0]));
								const clampedMax = Math.max(min, Math.min(max, newValue[1]));
								const finalRange: [number, number] = [
									Math.min(clampedMin, clampedMax),
									Math.max(clampedMin, clampedMax)
								];
								// Skip if unchanged (prevents bind:value sync from writing defaults to URL)
								if (
									Array.isArray(filter.value) &&
									filter.value[0] === finalRange[0] &&
									filter.value[1] === finalRange[1]
								)
									return;
								filter.value = finalRange;
							}
						}
						{min}
						{max}
						{step}
						type="multiple"
						class="cursor-pointer"
					/>
				{:else}
					<Slider
						bind:value={
							() => {
								// Single value mode
								if (filter?.value === undefined || filter?.value === null) return min;
								// During loading, preserve the filter value even if it's outside fallback range
								if (loading && typeof filter.value === 'number') return filter.value;
								if (typeof filter.value !== 'number') return min;
								return Math.max(min, Math.min(max, filter.value));
							},
							(newValue: number) => {
								if (!filter) return;
								// During loading, don't clamp - wait for real min/max values
								if (loading) {
									filter.value = newValue;
									return;
								}
								// Single value mode
								const clamped = Math.max(min, Math.min(max, newValue));
								// Skip if unchanged (prevents bind:value sync from writing defaults to URL)
								if (filter.value === clamped) return;
								filter.value = clamped;
							}
						}
						{min}
						{max}
						{step}
						type="single"
						class="cursor-pointer"
					/>
				{/if}
				<div class="text-muted-foreground mt-[6.5px] flex justify-between text-xs">
					<span>{formattedMin}</span>
					<span>{formattedMax}</span>
				</div>
			</div>
		{/if}
	</div>
{/if}
