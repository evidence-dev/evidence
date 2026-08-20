<script lang="ts">
	import { browser } from '../../../shims/env';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { loadLucideIcon } from '../../common/dynamic-icon';
	import type { Component } from 'svelte';
	import { cn } from '../../../shadcn/utils';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	type Props = UserComponentProps<typeof schema>;

	let props: Props = $props();

	// Get filter contexts for variable processing
	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
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

	const name = $derived(resolveText(props.name));
	const color = $derived(resolveText(props.color));
	const tooltip = $derived(resolveText(props.tooltip));
	const size = $derived(props.size);
	const stroke_width = $derived(props.stroke_width);

	let IconComponent = $state<Component | null>(null);
	let iconError = $state<string | null>(null);

	$effect(() => {
		if (name && browser) {
			try {
				IconComponent = loadLucideIcon(name);
				iconError = null;
			} catch (_error) {
				IconComponent = null;
				iconError = `Failed to load icon: ${name}`;
			}
		} else {
			IconComponent = null;
		}
	});
</script>

{#if IconComponent}
	{#if tooltip}
		<Tooltip.Root>
			<Tooltip.Trigger>
				<IconComponent
					class="inline-block align-[-2px]"
					style="color: {color}; width: {size}px; height: {size}px; stroke-width: {stroke_width}px"
				/>
			</Tooltip.Trigger>
			<Tooltip.Content class="evidence-page-theme max-w-96" sideOffset={2}
				>{tooltip}</Tooltip.Content
			>
		</Tooltip.Root>
	{:else}
		<IconComponent
			class="inline-block align-[-2px]"
			style="color: {color}; width: {size}px; height: {size}px; stroke-width: {stroke_width}px"
		/>
	{/if}
{:else if iconError}
	<div
		class={cn(
			'border-destructive/20 bg-destructive/10 text-destructive flex items-center justify-center rounded border'
		)}
		title={iconError}
	>
		<span class="text-xs">?</span>
	</div>
{/if}
