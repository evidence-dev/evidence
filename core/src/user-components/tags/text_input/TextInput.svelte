<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import type { Filter } from '../../../Filter.svelte';
	import { Label } from '../../../shadcn/components/ui/label';
	import { Input } from '../../../shadcn/components/ui/input';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import formatTitle from '../../formatTitle';
	import Info from '../info/Info.svelte';
	import { loadLucideIcon } from '../../common/dynamic-icon';
	import type { Component } from 'svelte';
	import { browser } from '../../../shims/env';
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
	const title = $derived(resolveText(props.title));
	const info = $derived(resolveText(props.info));
	const info_link = $derived(resolveText(props.info_link));
	const info_link_title = $derived(resolveText(props.info_link_title));
	const icon = $derived(resolveText(props.icon));
	const placeholder = $derived(resolveText(props.placeholder) ?? 'Enter text...');

	let filter: Filter<string> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<string> | undefined) : undefined
	);

	let IconComponent: Component | null = $state(null);

	// Load icon when icon prop changes
	$effect(() => {
		if (browser && icon) {
			IconComponent = loadLucideIcon(icon);
		} else {
			IconComponent = null;
		}
	});
</script>

<div class="flex flex-col">
	{#if title || info}
		<Label for={id} class="mb-2">
			{title ?? formatTitle(id)}
			{#if info}
				<Info text={info} link={info_link} link_title={info_link_title} className="-mb-0.5" />
			{/if}
		</Label>
	{/if}

	{#if filter}
		<div class="relative mt-auto mb-3 pb-1">
			{#if IconComponent}
				<div class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
					<IconComponent class="text-muted-foreground h-4 w-4" />
				</div>
			{/if}
			<Input
				{id}
				type="text"
				{placeholder}
				bind:value={
					() => filter?.value ?? '',
					(newValue) => {
						if (!filter) return;
						filter.value = newValue === '' ? undefined : newValue;
					}
				}
				class="bg-input-surface {IconComponent ? 'pl-9' : ''}"
			/>
		</div>
	{/if}
</div>
