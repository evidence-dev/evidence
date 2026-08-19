<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { type Filter } from '../../../Filter.svelte';
	import { Query } from '../../../Query.svelte';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { extractSQLProps } from '../../common/sql-options';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { Skeleton } from '../../../shadcn/components/ui/skeleton';
	import { setInputTabsContext } from './input-tabs-context';
	import { untrack } from 'svelte';
	import type { Option as TOption } from '../option/types';
	import { useId } from 'bits-ui';
	import { cn } from '../../../shadcn/utils';
	import { crossfade } from 'svelte/transition';
	import { tv } from 'tailwind-variants';

	// Tab styling variants - copied from Tabs.svelte to ensure identical styling
	const tabListVariants = tv({
		base: 'inline-flex items-center',
		variants: {
			variant: {
				well: 'dark:bg-input/30 bg-muted text-muted-foreground border rounded-lg',
				default: 'bg-transparent text-muted-foreground border-b border-border'
			},
			full_width: {
				true: 'w-full',
				false: 'w-fit'
			},
			align: {
				left: 'justify-start',
				right: 'justify-end'
			}
		},
		compoundVariants: [
			{
				variant: 'default',
				full_width: true,
				class: 'w-full justify-center'
			},
			{
				variant: 'default',
				full_width: false,
				class: 'w-full'
			},
			{
				variant: 'well',
				full_width: true,
				class: 'justify-center'
			}
		],
		defaultVariants: {
			variant: 'default',
			full_width: false,
			align: 'left'
		}
	});

	const tabTriggerVariants = tv({
		base: 'relative flex items-center justify-center text-sm transition-colors data-[state=active]:font-semibold',
		variants: {
			variant: {
				well: 'data-[state=active]:text-primary hover:text-primary',
				default: 'data-[state=active]:text-foreground hover:text-foreground'
			},
			full_width: {
				true: 'flex-1  p-1',
				false: 'flex-1 p-0.5'
			}
		},
		compoundVariants: [
			{
				variant: 'default',
				full_width: false,
				class: 'flex-none p-0.5'
			}
		],
		defaultVariants: {
			variant: 'default',
			full_width: false
		}
	});

	const tabIndicatorVariants = tv({
		base: 'absolute z-0',
		variants: {
			variant: {
				well: 'bg-background border shadow-xs',
				default: 'border-b border-primary h-0'
			},
			full_width: {
				true: '',
				false: ''
			}
		},
		compoundVariants: [
			{
				variant: 'well',
				full_width: true,
				class: 'inset-0.5 rounded-md'
			},
			{
				variant: 'well',
				full_width: false,
				class: 'top-0 h-full w-full left-0 rounded-md'
			},
			{
				variant: 'default',
				full_width: true,
				class: '-bottom-px top-auto left-0 right-0 rounded-full'
			},
			{
				variant: 'default',
				full_width: false,
				class: '-bottom-[3px] top-auto !left-0 !right-0 -mx-[2px] rounded-none'
			}
		],
		defaultVariants: {
			variant: 'default',
			full_width: false
		}
	});

	const props: UserComponentProps<typeof schema> = $props();

	// Get the query info context for registration
	const { getComponentId, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	// Resolved props
	const id = $derived(props.id);
	const table = $derived(resolveText(props.data));
	const valueColumn = $derived(resolveColumn(props.value_column));
	const labelColumn = $derived(resolveColumn(props.label_column));
	const filterIds = $derived(props.filters);
	const children = $derived(props.children);
	const variant = $derived(props.variant ?? 'default');
	const fullWidth = $derived(props.full_width ?? false);
	const align = $derived(props.align ?? 'left');
	const selectFirst = $derived(props.select_first ?? true);

	// Create crossfade transitions for indicator
	const [send, receive] = crossfade({
		duration: 200
	});

	// Extract SQL props
	const { where: rawWhere, order: rawOrder } = $derived.by(() => extractSQLProps(props));
	const where = $derived(resolveSql(props.where) ?? rawWhere);
	const order = $derived(resolveSql(props.order) ?? rawOrder);
	const resolvedDateRange = $derived.by(() => {
		if (!props.date_range) return undefined;
		return {
			...props.date_range,
			range: resolveText(props.date_range.range)
		};
	});

	let filter: Filter<string> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<string> | undefined) : undefined
	);

	const hasValidationErrors = $derived(hasBlockingErrors());

	// Define the query config with processed columns
	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}

		// Only run query if we have both data and value_column
		if (!table || !valueColumn) {
			return;
		}

		const valueProcessed = processColumnExpression(
			{ value: `DISTINCT ${valueColumn} as value` },
			connection.dialect
		);

		const columns = [valueProcessed];

		if (labelColumn) {
			const labelProcessed = processColumnExpression(
				{ value: `${labelColumn} as label` },
				connection.dialect
			);
			columns.push(labelProcessed);
		}

		// Build base WHERE clause to filter out nulls
		const baseWhere = `${valueColumn} IS NOT NULL`;

		// Combine with custom where clause if provided
		const combinedWhere = where ? `${baseWhere} AND (${where})` : baseWhere;

		return {
			tableExpressionName: table ?? '',
			columns: columns,
			filterIds: filterIds,
			where: combinedWhere,
			date_range: resolvedDateRange,
			order: order ?? valueColumn
		};
	});

	const optionsQuery = new Query<{ value: string; label?: string }>(() => queryConfig, {
		connection,
		filterContexts: [repeatFilters, pageFilters],
		inlineQueries,
		projectSettings: getProjectSettingsContext(),
		defaultRefreshInterval: undefined
	});

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'input_tabs', optionsQuery);
	});

	// Only consider it loading if we actually have a query to run
	const loading = $derived(table && valueColumn ? optionsQuery.loading : false);

	// Minimal readiness: input tabs is ready when its options query is done (or when there's no query)
	setupRenderReadiness('input_tabs', () => !loading);

	let optionsFromChildren: TOption[] = $state([]);
	let optionsFromRows: TOption[] = $derived(
		optionsQuery.result?.rows.map((row) => ({
			id: useId(),
			...row,
			value: String(row.value)
		})) ?? []
	);

	// Combine options from children and rows
	const options = $derived.by(() => {
		const values = new Set<string>();
		const combined: TOption[] = [];

		// Children options take precedence
		optionsFromChildren.forEach((opt) => {
			if (!values.has(opt.value)) {
				values.add(opt.value);
				combined.push(opt);
			}
		});

		// Then add options from query
		optionsFromRows.forEach((opt) => {
			if (!values.has(opt.value)) {
				values.add(opt.value);
				combined.push(opt);
			}
		});

		return combined;
	});

	// Pass combined options to filter for label lookup
	$effect(() => {
		if (filter) {
			filter.attributes._combinedOptions = options;
		}
	});

	// Setup context for child Option components
	setInputTabsContext({
		addOption: (option) => {
			untrack(() => {
				if (!optionsFromChildren.some((opt) => opt.id === option.id)) {
					optionsFromChildren.push(option);
				}
			});
		},
		removeOption: (option) => {
			untrack(() => {
				const index = optionsFromChildren.findIndex((opt) => opt.id === option.id);
				if (index !== -1) {
					optionsFromChildren.splice(index, 1);
				}
			});
		}
	});

	// Handle tab click (always single selection)
	const handleTabClick = (value: string) => {
		if (filter) {
			filter.value = value;
		}
	};

	// Auto-select first option when selectFirst is true and no value is set
	$effect(() => {
		if (selectFirst && filter && options.length > 0 && !filter.value) {
			filter.setDefault(options[0].value);
		}
	});
</script>

{#if filter}
	<div class={cn('relative max-w-full min-w-0')}>
		{#if loading}
			<!-- Tab-style skeleton - matches Tabs component styling -->
			<div class="overflow-x-auto">
				<div class={cn(tabListVariants({ variant, full_width: fullWidth, align }))}>
					{#each [1, 2, 3] as _i}
						<div class={cn(tabTriggerVariants({ variant, full_width: fullWidth }))}>
							<div class="relative z-10 h-full px-2 py-1">
								<Skeleton class="h-6 w-16" />
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if options.length === 0}
			<div class="overflow-x-auto">
				<div class={cn(tabListVariants({ variant, full_width: fullWidth, align }))}>
					<button
						type="button"
						disabled
						class={cn(
							tabTriggerVariants({ variant, full_width: fullWidth }),
							'cursor-not-allowed opacity-50'
						)}
					>
						<div class="relative z-10 h-full px-2 py-1">
							<span
								class="text-muted-foreground relative z-20 flex items-center gap-1.5 whitespace-nowrap"
							>
								No options available
							</span>
						</div>
					</button>
				</div>
			</div>
		{:else}
			<!-- Tab-style display (always single selection) - uses identical styling to Tabs component -->
			<div class="overflow-x-auto">
				<div class={cn(tabListVariants({ variant, full_width: fullWidth, align }))}>
					{#each options as option (option.value)}
						<button
							type="button"
							onclick={() => handleTabClick(option.value)}
							class={cn(tabTriggerVariants({ variant, full_width: fullWidth }))}
							data-state={filter?.value === option.value ? 'active' : 'inactive'}
						>
							{#if fullWidth && filter?.value === option.value}
								<div
									class={cn(tabIndicatorVariants({ variant, full_width: fullWidth }))}
									in:receive={{ key: 'input-tabs-indicator' }}
									out:send={{ key: 'input-tabs-indicator' }}
								></div>
							{/if}
							<div class="relative z-10 h-full px-2 py-1">
								{#if !fullWidth && filter?.value === option.value}
									<div
										class={cn(tabIndicatorVariants({ variant, full_width: fullWidth }))}
										in:receive={{ key: 'input-tabs-indicator' }}
										out:send={{ key: 'input-tabs-indicator' }}
									></div>
								{/if}
								<span class="relative z-20 flex items-center gap-1.5 whitespace-nowrap">
									{option.label ?? option.value}
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- Render children hidden so they mount and register their options -->
{#if children}
	<div class="hidden">
		{@render children()}
	</div>
{/if}
