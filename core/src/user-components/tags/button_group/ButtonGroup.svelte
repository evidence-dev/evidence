<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { type Filter } from '../../../Filter.svelte';
	import { Label } from '../../../shadcn/components/ui/label';
	import * as ToggleGroup from '../../../shadcn/components/ui/toggle-group';
	import { Query } from '../../../Query.svelte';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import Info from '../info/Info.svelte';
	import formatTitle from '../../formatTitle';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { extractSQLProps } from '../../common/sql-options';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { Skeleton } from '../../../shadcn/components/ui/skeleton';
	import { setButtonGroupContext } from './button-group-context';
	import { untrack } from 'svelte';
	import type { Option as TOption } from '../option/types';
	import { useId } from 'bits-ui';
	import { cn } from '../../../shadcn/utils';

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
	const title = $derived(resolveText(props.title));
	const info = $derived(resolveText(props.info));
	const multiple = $derived(props.multiple);
	const children = $derived(props.children);
	const selectFirst = $derived(props.select_first ?? false);
	const orientation = $derived(props.orientation ?? 'horizontal');
	const isVertical = $derived(orientation === 'vertical');
	const maxHeight = $derived(isVertical ? props.max_height : undefined);

	const rootClass = $derived(isVertical ? 'flex-col items-stretch max-w-full' : '');
	const itemClass = $derived(
		isVertical
			? 'w-full min-w-0 justify-start text-left px-3 py-2 rounded-none! first:rounded-t-md! last:rounded-b-md! data-[variant=outline]:border-l! data-[variant=outline]:border-t-0! data-[variant=outline]:first:border-t!'
			: 'flex-none px-6 py-2 whitespace-nowrap'
	);
	const selectedClass = 'data-[state=on]:font-semibold';
	const wrapperClass = $derived(
		isVertical
			? cn('w-fit max-w-full min-w-0', maxHeight != null && 'overflow-y-auto')
			: 'overflow-x-auto pb-1'
	);
	const wrapperStyle = $derived(maxHeight != null ? `max-height: ${maxHeight}px;` : undefined);

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

	let filter: Filter<string | string[]> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<string | string[]> | undefined) : undefined
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

		// Deduplication is the GROUP BY's job — see Dropdown.svelte. A `DISTINCT` in the
		// expression would be copied into `GROUP BY DISTINCT col`, which Cube rejects.
		const valueProcessed = processColumnExpression(
			{ value: `${valueColumn} as value` },
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
		return queryInfoContext?.registerQuery(componentId, 'button_group', optionsQuery, title);
	});

	// Only consider it loading if we actually have a query to run
	const loading = $derived(table && valueColumn ? optionsQuery.loading : false);

	// Minimal readiness: button group is ready when its options query is done (or when there's no query)
	setupRenderReadiness('button_group', () => !loading);

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

	// Setup context for child Option components
	setButtonGroupContext({
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

	// Use multiple prop directly (button group always respects the multiple setting)
	const effectiveMultiple = $derived(multiple);

	// Bind toggle group value to filter
	let toggleValue = $derived.by(() => {
		if (!filter?.value) return effectiveMultiple ? [] : undefined;
		return filter.value;
	});

	// Update filter when toggle group changes
	const handleValueChange = (value: string | string[] | undefined) => {
		if (filter) {
			filter.value = value ?? (effectiveMultiple ? [] : '');
		}
	};

	// Pass combined options to filter for label lookup
	$effect(() => {
		if (filter) {
			filter.attributes._combinedOptions = options;
		}
	});

	// Auto-select first option when selectFirst is true and no value is set
	$effect(() => {
		if (selectFirst && filter && options.length > 0 && !filter.value) {
			filter.setDefault(options[0].value);
		}
	});
</script>

<div class="flex flex-col">
	{#if title || info}
		<Label for={id} class="mb-2">
			{title ?? formatTitle(id)}
			{#if info}
				<Info text={info} className="-mb-0.5" />
			{/if}
		</Label>
	{/if}

	{#if filter}
		<div class={cn('relative mt-auto mb-3 max-w-full min-w-0')}>
			{#if loading}
				<!-- Button group skeleton -->
				<div class={wrapperClass} style={wrapperStyle}>
					<div
						class={cn(
							'flex w-fit items-center rounded-md shadow-xs print:shadow-none',
							isVertical && 'w-48 max-w-full flex-col items-stretch'
						)}
					>
						{#each [1, 2, 3] as _i}
							<Skeleton
								class={cn(
									'h-9',
									isVertical
										? 'w-full rounded-none first:rounded-t-md last:rounded-b-md'
										: 'w-24 rounded-none first:rounded-l-md last:rounded-r-md'
								)}
							/>
						{/each}
					</div>
				</div>
			{:else if options.length === 0}
				<div class={wrapperClass} style={wrapperStyle}>
					<ToggleGroup.Root
						type="single"
						variant="outline"
						disabled
						class={rootClass}
						{orientation}
					>
						<ToggleGroup.Item
							value="empty"
							class={cn('text-muted-foreground cursor-not-allowed opacity-50', itemClass)}
							disabled
						>
							No options available
						</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>
			{:else}
				<!-- Segmented toggle group -->
				<div class={wrapperClass} style={wrapperStyle}>
					{#if effectiveMultiple}
						<ToggleGroup.Root
							type="multiple"
							value={toggleValue as string[]}
							onValueChange={handleValueChange}
							variant="outline"
							class={rootClass}
							{orientation}
						>
							{#each options as option (option.value)}
								<ToggleGroup.Item
									value={option.value}
									class={cn('data-[state=off]:bg-input-surface', selectedClass, itemClass)}
								>
									<span class={cn(isVertical && 'min-w-0 flex-1 truncate')}>
										{option.label ?? option.value}
									</span>
								</ToggleGroup.Item>
							{/each}
						</ToggleGroup.Root>
					{:else}
						<ToggleGroup.Root
							type="single"
							value={toggleValue as string}
							onValueChange={handleValueChange}
							variant="outline"
							class={rootClass}
							{orientation}
						>
							{#each options as option (option.value)}
								<ToggleGroup.Item
									value={option.value}
									class={cn('data-[state=off]:bg-input-surface', selectedClass, itemClass)}
								>
									<span class={cn(isVertical && 'min-w-0 flex-1 truncate')}>
										{option.label ?? option.value}
									</span>
								</ToggleGroup.Item>
							{/each}
						</ToggleGroup.Root>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Render children hidden so they mount and register their options -->
{#if children}
	<div class="hidden">
		{@render children()}
	</div>
{/if}
