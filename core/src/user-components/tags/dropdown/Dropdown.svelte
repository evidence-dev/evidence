<!-- TODO should we support non-string options/values? -->
<!-- TODO fuzzy searching, not just starts with -->

<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { type Filter } from '../../../Filter.svelte';
	import * as Select from '../../../shadcn/components/ui/select';
	import { Label } from '../../../shadcn/components/ui/label';
	import * as Alert from '../../../shadcn/components/ui/alert';
	import { useId } from 'bits-ui';
	import { LoaderCircle, SearchIcon, XIcon } from 'lucide-svelte';
	import { Input } from '../../../shadcn/components/ui/input';
	import Separator from '../../../shadcn/components/ui/separator/separator.svelte';
	import Button from '../../../shadcn/components/ui/button/button.svelte';
	import { cn } from '../../../shadcn/utils';
	import { Badge } from '../../../shadcn/components/ui/badge';
	import { fade, slide } from 'svelte/transition';
	import { setDropdownContext } from './dropdown-context';
	import { untrack } from 'svelte';
	import type { Option as TOption } from '../option/types';
	import Option from '../option/Option.svelte';
	import { parseOptionsProp } from './parse-options-prop';
	import { isDropdownValueValid } from './validation';
	import { Query } from '../../../Query.svelte';
	import Ellipsis from '../../../viewer-components/Ellipsis.svelte';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { Virtualizer, type VirtualizerHandle } from 'virtua/svelte';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import Info from '../info/Info.svelte';
	import formatTitle from '../../formatTitle';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { processFilterIds } from '../../common/sql-options';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { loadLucideIcon } from '../../common/dynamic-icon';
	import type { Component } from 'svelte';
	import { browser } from '../../../shims/env';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { escapeSqlValue } from '../../../sql-dialect';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

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
	const options = $derived(props.options);
	const filterIds = $derived(props.filters);
	const title = $derived(resolveText(props.title));
	const info = $derived(resolveText(props.info));
	const info_link = $derived(resolveText(props.info_link));
	const info_link_title = $derived(resolveText(props.info_link_title));
	const icon = $derived(resolveText(props.icon));
	const placeholder = $derived(
		resolveText(props.placeholder) ??
			(valueColumn ? `Select ${formatTitle(valueColumn)}` : 'Select Option')
	);
	const enableSearch = $derived(props.search);
	const multiple = $derived(props.multiple);
	const enableClear = $derived(props.clear);
	const order = $derived(resolveSql(props.order) ?? props.order);
	const where = $derived(resolveSql(props.where) ?? props.where);
	const resolvedDateRange = $derived.by(() => {
		if (!props.date_range) return undefined;
		return {
			...props.date_range,
			range: resolveText(props.date_range.range)
		};
	});
	const children = $derived(props.children);
	const selectFirst = $derived(props.select_first ?? false);
	const defaultTopN = $derived(props.default_top_n);

	let error: string | undefined = $state(undefined);
	let search: string = $state('');
	let open: boolean = $state(false);
	let virtualizer: VirtualizerHandle | undefined = $state();
	let IconComponent: Component | null = $state(null);

	// Scroll virtualized list to selected option
	$effect(() => {
		if (open && virtualizer) {
			let valueToFocus = multiple ? filter?.value?.[0] : filter?.value;
			const index = filteredOptions.findIndex((option) => option.value === valueToFocus);
			if (index >= 0) {
				virtualizer.scrollToIndex(index, { align: 'center' });
			}
		}
	});

	// Load icon when icon prop changes
	$effect(() => {
		if (browser && icon) {
			IconComponent = loadLucideIcon(icon);
		} else {
			IconComponent = null;
		}
	});

	let filter: Filter<string | string[]> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<string | string[]> | undefined) : undefined
	);

	const hasValidationErrors = $derived(hasBlockingErrors());

	const selectedValues = $derived.by(() => {
		if (!filter?.value) return [];
		return Array.isArray(filter.value) ? filter.value : [filter.value];
	});

	const baseQueryParts = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}

		if (!table || !valueColumn) {
			return;
		}

		// Distinct values come from the GROUP BY that generateSQLQuery emits for every
		// non-aggregate column — a `DISTINCT` baked into the expression would also land in
		// that GROUP BY (`GROUP BY DISTINCT col`), which Cube's parser rejects outright.
		const valueProcessed = processColumnExpression(
			{
				value: `${valueColumn} as value`
			},
			connection.dialect
		);

		const columns = [valueProcessed];

		if (labelColumn) {
			const labelProcessed = processColumnExpression(
				{
					value: `${labelColumn} as label`
				},
				connection.dialect
			);
			columns.push(labelProcessed);
		}

		// Generate filter SQL from filterIds
		const filterSql = processFilterIds(filterIds, [repeatFilters, pageFilters], connection.dialect);

		// Build the WHERE clause
		let whereClause = `${valueColumn} IS NOT NULL`;

		// Add filter SQL if it exists
		if (filterSql) {
			whereClause += ` AND (${filterSql})`;
		}

		// Add custom where clause if it exists
		if (where) {
			whereClause += ` AND (${where})`;
		}

		return { columns, whereClause };
	});

	// Define the query config with processed columns
	// Search is done server-side for scalability
	const queryConfig = $derived.by(() => {
		if (!baseQueryParts || !valueColumn) {
			return;
		}

		let whereClause = baseQueryParts.whereClause;

		if (search !== '') {
			const escapedSearch = escapeSqlValue(search, connection.dialect);
			// Search both value and label columns if label_column is specified
			let searchCondition: string;
			if (labelColumn) {
				searchCondition = `(${connection.dialect.caseInsensitiveLike(connection.dialect.castToString(valueColumn), `%${escapedSearch}%`)} OR ${connection.dialect.caseInsensitiveLike(connection.dialect.castToString(labelColumn), `%${escapedSearch}%`)})`;
			} else {
				searchCondition = connection.dialect.caseInsensitiveLike(
					connection.dialect.castToString(valueColumn),
					`%${escapedSearch}%`
				);
			}

			whereClause += ` AND ${searchCondition}`;
		}

		// Dedup via GROUP BY: inline DISTINCT emits `GROUP BY DISTINCT` (Cube rejects it), and
		// SELECT DISTINCT would broaden dedup whenever `order` references a column outside value/label.
		return {
			tableExpressionName: table ?? '',
			columns: baseQueryParts.columns,
			where: whereClause,
			date_range: resolvedDateRange,
			order: order ?? valueColumn,
			limit: 10000
		};
	});

	// Selected values can sit outside the main query's row limit (or the current
	// search term), so they're fetched separately with the same filters. This keeps
	// out-of-limit selections valid and displayable, while genuinely-stale values
	// (e.g. removed by a cascading filter) still come back empty and get cleared.
	const selectedOptionsQueryConfig = $derived.by(() => {
		if (!baseQueryParts || !valueColumn || selectedValues.length === 0) {
			return;
		}

		const escapedValues = selectedValues
			.map((v) => `'${escapeSqlValue(String(v), connection.dialect)}'`)
			.join(',');

		return {
			tableExpressionName: table ?? '',
			columns: baseQueryParts.columns,
			where: `${baseQueryParts.whereClause} AND ${valueColumn} IN (${escapedValues})`,
			date_range: resolvedDateRange,
			order: order ?? valueColumn,
			limit: 10000
		};
	});

	const projectSettings = getProjectSettingsContext();

	const optionsQuery = new Query<{ value: string; label?: string }>(() => queryConfig, {
		connection,
		filterContexts: [repeatFilters, pageFilters],
		inlineQueries,
		projectSettings,
		defaultRefreshInterval: undefined
	});

	const selectedOptionsQuery = new Query<{ value: string; label?: string }>(
		() => selectedOptionsQueryConfig,
		{
			connection,
			filterContexts: [repeatFilters, pageFilters],
			inlineQueries,
			projectSettings,
			defaultRefreshInterval: undefined
		}
	);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'dropdown', optionsQuery, title);
	});

	const loading = $derived(table && valueColumn ? optionsQuery.loading : false);

	// Minimal readiness: dropdown is ready when its options query is done
	setupRenderReadiness('dropdown', () => !loading);

	let optionsFromProp: TOption[] = $derived(parseOptionsProp(options));
	let optionsFromChildren: TOption[] = $state([]);
	let optionsFromRows: TOption[] = $derived(
		optionsQuery.result?.rows.map((row) => ({
			id: useId(),
			...row,
			value: String(row.value)
		})) ?? []
	);
	let optionsFromSelectedRows: TOption[] = $derived(
		selectedOptionsQuery.result?.rows.map((row) => ({
			id: useId(),
			...row,
			value: String(row.value)
		})) ?? []
	);
	// combinedOptions contains options from query (search matches + selected values)
	// Used for validation - selected values are always included via the SQL query
	const combinedOptions: TOption[] = $derived.by(() => {
		const values = new Set<string>();
		const options: TOption[] = [];

		// Precedence: children > prop > rows
		optionsFromChildren.forEach((opt) => {
			if (!values.has(opt.value)) {
				values.add(opt.value);
				options.push(opt);
			}
		});

		optionsFromProp.forEach((opt) => {
			if (!values.has(opt.value)) {
				values.add(opt.value);
				options.push(opt);
			}
		});
		optionsFromRows.forEach((opt) => {
			if (!values.has(opt.value)) {
				values.add(opt.value);
				options.push(opt);
			}
		});
		optionsFromSelectedRows.forEach((opt) => {
			if (!values.has(opt.value)) {
				values.add(opt.value);
				options.push(opt);
			}
		});
		return options;
	});

	// filteredOptions applies client-side search filtering for display
	// This ensures only search matches show in dropdown, while selected values remain valid
	const filteredOptions: TOption[] = $derived.by(() => {
		if (!search) return combinedOptions;

		const searchLower = search.toLowerCase();
		return combinedOptions.filter((opt) => {
			const valueMatch = opt.value.toLowerCase().includes(searchLower);
			const labelMatch = opt.label?.toLowerCase().includes(searchLower);
			return valueMatch || labelMatch;
		});
	});

	const hasFilteredOptions = $derived(filteredOptions.length > 0);

	const selected: TOption | TOption[] | undefined = $derived.by(() => {
		const value = filter?.value;
		if (!value) return [];

		// Whether we have any information about what valid options should look
		// like — used by `isDropdownValueValid` to short-circuit while loading.
		// The selected-values query must have settled successfully too: while it's
		// loading or errored we have no evidence the selection is stale, so keep it
		// (clearing a valid out-of-limit selection is worse than keeping a stale one).
		const selectedRowsPending =
			selectedOptionsQueryConfig !== undefined &&
			(selectedOptionsQuery.loading ||
				selectedOptionsQuery.result === undefined ||
				selectedOptionsQuery.error !== null);
		const hasQueryResults = optionsQuery.result !== undefined && !selectedRowsPending;
		const hasStaticOptions = optionsFromProp.length > 0 || optionsFromChildren.length > 0;

		const availableValues = new Set(combinedOptions.map((opt) => opt.value));
		const validationOpts = { hasQueryResults, hasStaticOptions };

		if (multiple) {
			// Filter out any selections that are no longer available. `isDropdownValueValid`
			// short-circuits to keep values when the option set is empty / still loading
			// (the PDF-export case), so a length difference only appears once we
			// have a concrete, non-empty option set with truly-stale entries.
			const filteredSelection = (value as string[]).filter((v) =>
				isDropdownValueValid(v, availableValues, validationOpts)
			);

			if (filteredSelection.length !== (value as string[]).length) {
				// Re-check against the latest option set in the timeout callback to avoid
				// clearing selections while child options are still registering.
				setTimeout(() => {
					if (!filter || !Array.isArray(filter.value)) return;
					const latestAvailableValues = new Set(combinedOptions.map((opt) => opt.value));
					const latestFilteredSelection = filter.value.filter((v) =>
						isDropdownValueValid(v, latestAvailableValues, validationOpts)
					);
					if (latestFilteredSelection.length !== filter.value.length) {
						filter.value = latestFilteredSelection;
					}
				}, 0);
			}

			return combinedOptions.filter((opt) => filteredSelection.includes(opt.value));
		} else {
			// For single selection, check if the current value is still available.
			// `isDropdownValueValid` preserves the value while options are still
			// loading OR when options came back empty (e.g. transient query error
			// on first paint in PDF mode). Without that guard, the
			// value gets cleared and `select_first` then locks in an arbitrary
			// default once options eventually load.
			if (!isDropdownValueValid(value as string, availableValues, validationOpts)) {
				// Re-check against the latest option set in the timeout callback to avoid
				// clearing initial selections while child options are still registering.
				setTimeout(() => {
					if (!filter || Array.isArray(filter.value) || !filter.value) return;
					const latestAvailableValues = new Set(combinedOptions.map((opt) => opt.value));
					if (!isDropdownValueValid(filter.value, latestAvailableValues, validationOpts)) {
						filter.value = '';
					}
				}, 0);
				return undefined;
			}
			const found = combinedOptions.find((opt) => opt.value === (value as string));
			// While loading or when options came back empty (no options yet),
			// show the filter value as-is so the dropdown displays the selection
			// immediately instead of a placeholder.
			if (!found) {
				return { id: useId(), value: value as string };
			}
			return found;
		}
	});

	setDropdownContext({
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

	// Pass combined options to filter for label lookup
	$effect(() => {
		if (filter) {
			filter.attributes._combinedOptions = combinedOptions;
		}
	});

	// Programmatic load-time default selection. The `filter.value` guard makes this
	// apply exactly once (after the async options query populates combinedOptions) and
	// not fight the user afterward — note an empty array from clear() is truthy, so a
	// cleared multi-select stays cleared. Uses setDefault() to avoid a URL write.
	$effect(() => {
		if (!filter || combinedOptions.length === 0 || filter.value) return;

		if (multiple && defaultTopN != null && defaultTopN > 0) {
			filter.setDefault(combinedOptions.slice(0, defaultTopN).map((opt) => opt.value));
		} else if (selectFirst) {
			filter.setDefault(multiple ? [combinedOptions[0].value] : combinedOptions[0].value);
		}
	});

	const unselect = (option: string) => {
		if (!filter || !Array.isArray(filter.value)) return;
		filter.value = filter.value.filter((opt) => opt !== option);
	};

	const selectAll = () => {
		if (!filter || !multiple) return;
		open = false;
		// Select all visible (filtered) options, preserving any existing selections
		const currentValues = new Set(Array.isArray(filter.value) ? filter.value : []);
		filteredOptions.forEach((opt) => currentValues.add(opt.value));
		filter.value = Array.from(currentValues);
	};

	const clear = () => {
		open = false;
		if (!filter) return;
		if (multiple) {
			filter.value = [];
		} else {
			filter.value = '';
		}
	};
</script>

{#if title || info}
	<Label for={id} class="mb-2">
		{title ?? formatTitle(id)}
		{#if info}
			<Info text={info} link={info_link} link_title={info_link_title} className="-mb-0.5" />
		{/if}
	</Label>
{/if}
{#if error}
	<Alert.Root variant="destructive" class="my-2">
		<Alert.Title>
			Error in Dropdown <span class="font-mono">name="{id}"</span>
		</Alert.Title>
		<Alert.Description>
			{error}
		</Alert.Description>
	</Alert.Root>
{/if}

{#if filter}
	<div class="relative mb-4">
		<Select.Root
			type={multiple ? 'multiple' : 'single'}
			bind:value={
				() => {
					if (!filter?.value) {
						if (multiple) return [];
						// The Select component types struggle when `type` is a conditional
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						return '' as any;
					}
					return filter?.value;
				},
				(newValue) => {
					if (!filter) return;
					filter.value = newValue === '' ? undefined : newValue;
				}
			}
			bind:open
			onOpenChange={(newOpen) => {
				// Clear search after dropdown closes
				if (!newOpen) {
					setTimeout(() => {
						search = '';
					}, 200);
				}
			}}
		>
			<Select.Trigger
				{id}
				class="bg-input-surface hover:bg-accent/30 justify-end"
				disabled={loading || Boolean(error)}
			/>

			<Select.Content
				class={cn(
					'evidence-page-theme relative w-(--bits-select-anchor-width) min-w-(--bits-select-anchor-width) overflow-y-auto',
					{
						'pt-10': enableSearch,
						'pb-10': enableClear && !multiple && hasFilteredOptions,
						'pb-[72px]': enableClear && multiple && hasFilteredOptions
					}
				)}
			>
				{#if enableSearch}
					<div class="fixed top-0 right-0 left-0 mx-1 mt-1">
						<div class="relative">
							<Input
								bind:value={search}
								aria-label="Search"
								placeholder="Search"
								class="h-8 border-none p-0 pl-8 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
								autofocus
							/>
							<div class="absolute top-0 left-0 flex h-full items-center justify-center">
								<SearchIcon class="text-muted-foreground ml-2 h-4 w-4" />
							</div>
						</div>
						<Separator orientation="horizontal" class="my-1" />
					</div>
				{/if}

				{#if filteredOptions.length === 0}
					<div class="text-muted-foreground px-2 py-1.5 text-sm">No options found</div>
				{:else}
					<div class="max-h-[300px] overflow-y-auto">
						<Virtualizer
							bind:this={virtualizer}
							data={filteredOptions}
							getKey={(option) => option.value}
						>
							{#snippet children(option)}
								<Select.Item value={option.value} class="cursor-pointer">
									{option.label ?? option.value}
								</Select.Item>
							{/snippet}
						</Virtualizer>
					</div>
				{/if}

				{#if enableClear && hasFilteredOptions}
					<div class="fixed right-0 bottom-0 left-0 mx-1 mb-1">
						<Separator orientation="horizontal" class="mb-1" />
						{#if multiple}
							<Button variant="ghost" size="sm" class="h-7 w-full" onclick={selectAll}>
								Select All
							</Button>
							<Separator orientation="horizontal" class="my-1" />
						{/if}
						<Button variant="ghost" size="sm" class="h-7 w-full" onclick={clear}>Clear</Button>
					</div>
				{/if}
			</Select.Content>
		</Select.Root>

		<!--
			Selected state exists outside of trigger so that we can have the multiselected items appear as buttons that unselect themselves when clicked
			Buttons should not be nested in buttons, so we can't put them inside the trigger
		-->
		<div
			class="pointer-events-none absolute inset-0 flex w-full items-center justify-between pr-8 text-sm"
			class:pl-2={!IconComponent}
			class:pl-3={IconComponent}
		>
			<div class="flex min-w-0 flex-1 items-center gap-2">
				{#if IconComponent}
					<IconComponent class="text-muted-foreground mr-1 size-3.5 shrink-0" />
				{/if}
				{#if multiple && Array.isArray(selected)}
					<div
						class="no-scrollbar pointer-events-none z-10 flex min-w-0 flex-1 flex-row gap-1 overflow-auto"
					>
						{#each selected.slice(0, selected.length > 4 ? 3 : 4) as opt (opt.value)}
							<button
								class="pointer-events-auto max-w-[80%] shrink-0"
								aria-label="Unselect {opt}"
								onclick={() => unselect(opt.value)}
								out:slide={{ axis: 'x' }}
							>
								<Badge variant="secondary" class="group flex w-full px-1.5 py-0.5 text-nowrap">
									<Ellipsis class="flex-1">
										{opt.label ?? opt.value}
									</Ellipsis>
									<span
										class="flex h-full w-0 shrink-0 items-center justify-center overflow-hidden opacity-0 transition-all group-hover:w-5 group-hover:opacity-100"
									>
										<XIcon class="text-muted-foreground ml-1.5 size-4" />
									</span>
								</Badge>
							</button>
						{/each}
						{#if selected.length > 4}
							<Badge variant="secondary" class="pointer-events-none shrink-0 px-1.5 py-0.5">
								+{selected.length - 3} more
							</Badge>
						{/if}
						{#if selected.length === 0}
							<div
								class="text-muted-foreground pointer-events-none block h-full max-w-full items-center justify-center truncate"
								in:fade={{ delay: 300, duration: 200 }}
							>
								{placeholder}
							</div>
						{/if}
					</div>
				{:else if !multiple && !Array.isArray(selected) && selected}
					<Ellipsis class="text-foreground min-w-0 flex-1">
						{selected.label ?? selected.value}
					</Ellipsis>
				{:else if placeholder}
					<span class="text-muted-foreground block truncate">{placeholder}</span>
				{/if}
			</div>

			<LoaderCircle
				class="text-muted-foreground animate-spin [animation-duration:1s] {loading
					? 'opacity-100'
					: 'opacity-0'} h-4 w-4 transition-opacity duration-500"
			/>
		</div>
	</div>
{/if}

<!-- Render children hidden so they mount and register their options -->
{#if children}
	<div class="hidden">
		{@render children()}
	</div>
{:else if options}
	<div class="hidden">
		{#each optionsFromProp as option}
			<Option {...option} />
		{/each}
	</div>
{/if}
