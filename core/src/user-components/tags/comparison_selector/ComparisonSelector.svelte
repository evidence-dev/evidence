<script lang="ts">
	import { untrack } from 'svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { COMPARISON_VALUES } from '../../common/comparison-schema';
	import EnumSelector from '../common/EnumSelector.svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { Filter } from '../../../Filter.svelte';
	import type { AvailableIconName } from '../../common/icon-names';
	import formatTitle from '../../formatTitle';
	import { setComparisonSelectorContext } from './comparison-selector-context';
	import type { BenchmarkComparisonOption, TargetComparisonOption } from './types';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	type CustomComparisonOption = BenchmarkComparisonOption | TargetComparisonOption;

	interface Props extends UserComponentProps<typeof schema> {
		children?: import('svelte').Snippet;
	}

	const props: Props = $props();

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

	const { resolveText } = $derived(createResolvers(variableProcessor));

	// Resolved props
	const id = $derived(props.id);
	const presetValues = $derived(props.preset_values as string[] | undefined);
	const defaultValue = $derived(resolveText(props.default_value) ?? props.default_value);
	const title = $derived(resolveText(props.title));
	const info = $derived(resolveText(props.info));
	const info_link = $derived(resolveText(props.info_link));
	const info_link_title = $derived(resolveText(props.info_link_title));
	const placeholder = $derived(resolveText(props.placeholder));
	const icon = $derived((resolveText(props.icon) ?? 'triangle') as AvailableIconName);

	// Collect custom options from children
	let customOptions: CustomComparisonOption[] = $state([]);

	// Setup context for child components (benchmark_comparison, target_comparison)
	setComparisonSelectorContext({
		addOption: (option) => {
			untrack(() => {
				if (!customOptions.some((opt) => opt.id === option.id)) {
					customOptions.push(option);
				}
			});
		},
		removeOption: (option) => {
			untrack(() => {
				const index = customOptions.findIndex((opt) => opt.id === option.id);
				if (index !== -1) {
					customOptions.splice(index, 1);
				}
			});
		}
	});

	// A name that is neither a built-in nor a registered custom option resolves to no config, so
	// offering it would yield an empty {{comp.literal}}. Custom names are added back below.
	const builtinItems = $derived(
		presetValues
			? presetValues.filter((v) =>
					COMPARISON_VALUES.includes(v as (typeof COMPARISON_VALUES)[number])
				)
			: Array.from(COMPARISON_VALUES)
	);

	// Combine built-in items with custom option names
	const items = $derived.by(() => {
		const combined = [...builtinItems];
		for (const opt of customOptions) {
			if (!combined.includes(opt.name)) {
				combined.push(opt.name);
			}
		}
		return combined;
	});

	// Initialize the filter
	let filter: Filter<string> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<string> | undefined) : undefined
	);

	// Pass custom options to filter for template value lookup
	$effect(() => {
		if (filter) {
			filter.attributes._customOptions = customOptions;
		}
	});

	// Determine initial value
	const initialValue = $derived.by(() => {
		return defaultValue || (items.length > 0 ? items[0] : undefined);
	});

	// Set initial value (don't write to URL for programmatic defaults)
	$effect(() => {
		if (filter && !filter.value && initialValue) {
			filter.setDefault(initialValue);
		}
	});

	// Derive selected value from filter
	let selected = $derived(filter?.value || initialValue);

	const handleValueChange = (value: string | undefined) => {
		if (filter && value) {
			filter.value = value;
		}
	};

	// Custom label formatter
	const formatComparisonLabel = (value: string) => {
		// Custom options already have nice names, built-ins get "vs. " prefix
		const isCustom = customOptions.some((opt) => opt.name === value);
		if (isCustom) {
			return value; // Use custom option name as-is
		}
		return `vs. ${formatTitle(value)}`;
	};
</script>

<!-- Render children to register custom options -->
{#if props.children}
	{@render props.children()}
{/if}

<EnumSelector
	{id}
	{items}
	bind:selected
	onValueChange={handleValueChange}
	{title}
	{info}
	{info_link}
	{info_link_title}
	{placeholder}
	{icon}
	labelFormatter={formatComparisonLabel}
/>
