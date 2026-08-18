<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import EnumSelector from '../common/EnumSelector.svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { Filter } from '../../../Filter.svelte';
	import type { AvailableIconName } from '../../common/icon-names';
	import { DATE_GRAINS } from '../../common/date-options';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	const props: UserComponentProps<typeof schema> = $props();

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
	const icon = $derived((resolveText(props.icon) ?? 'clock') as AvailableIconName);

	// All available date grain options from the app
	const allDateGrains = Array.from(DATE_GRAINS);

	// preset_values narrows the list; it can't widen it. A grain outside DATE_GRAINS resolves to
	// an empty {{grain.literal}}, so offering one would hand the author a silently broken page.
	const items = $derived.by(() => {
		const presets = presetValues?.filter((v) => DATE_GRAINS.includes(v)) ?? [];
		return presets.length > 0 ? presets : allDateGrains;
	});

	// Initialize the filter
	let filter: Filter<string> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<string> | undefined) : undefined
	);

	// Determine initial value
	const initialValue = $derived.by(() => {
		if (defaultValue && DATE_GRAINS.includes(defaultValue)) return defaultValue;
		return items.length > 0 ? items[0] : undefined;
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
</script>

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
/>
