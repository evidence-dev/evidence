<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { Button } from '../../../shadcn/components/ui/button';
	import { cn } from '../../../shadcn/utils';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import Check from 'lucide-svelte/icons/check';
	import { onMount } from 'svelte';

	interface PresetItem {
		label: string;
		values: Record<string, any>;
	}

	const props: UserComponentProps<typeof schema> = $props();

	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	const variableProcessor = $derived.by(() => {
		if (!inlineQueries) return null;
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText } = $derived(createResolvers(variableProcessor));

	const title = $derived(resolveText(props.title) ?? '');
	const presets = $derived((props.presets ?? []) as PresetItem[]);
	const defaultPreset = $derived(props.default_preset);
	const variant = $derived(props.variant ?? 'pills');
	const size = $derived(props.size ?? 'sm');
	const align = $derived(props.align ?? 'left');

	// Determine if a given preset is currently active
	function isPresetActive(preset: PresetItem): boolean {
		if (!pageFilters || !preset.values) return false;
		const entries = Object.entries(preset.values);
		if (entries.length === 0) return false;

		return entries.every(([key, expectedVal]) => {
			const filter = pageFilters.get(key);
			if (!filter) return false;
			const currentVal = filter.value;

			if (Array.isArray(expectedVal) && Array.isArray(currentVal)) {
				return (
					expectedVal.length === currentVal.length &&
					expectedVal.every((v, i) => v === currentVal[i])
				);
			}
			return currentVal === expectedVal;
		});
	}

	function applyPreset(preset: PresetItem) {
		if (!pageFilters || !preset.values) return;

		const isActive = isPresetActive(preset);

		for (const [key, val] of Object.entries(preset.values)) {
			let filter = pageFilters.get(key);
			if (!filter) {
				filter = pageFilters.createExternal(key, undefined, key);
			}

			if (isActive) {
				// Toggle off if already active
				filter.value = undefined;
			} else {
				filter.value = val;
			}
		}
	}

	// Apply default preset on mount if specified and not already filtered
	onMount(() => {
		if (!defaultPreset || !pageFilters) return;
		const target = presets.find((p) => p.label.toLowerCase() === defaultPreset.toLowerCase());
		if (target && !isPresetActive(target)) {
			applyPreset(target);
		}
	});
</script>

<div class="flex flex-col gap-1.5 my-2">
	{#if title}
		<ComponentTitle {title} />
	{/if}

	<div
		class={cn(
			'flex flex-wrap items-center gap-1.5',
			align === 'center' && 'justify-center',
			align === 'right' && 'justify-end',
			align === 'left' && 'justify-start'
		)}
	>
		{#each presets as preset}
			{@const active = isPresetActive(preset)}
			{#if variant === 'pills'}
				<button
					type="button"
					onclick={() => applyPreset(preset)}
					class={cn(
						'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-all text-xs select-none shadow-xs',
						size === 'sm' && 'px-2.5 py-0.5 text-xs',
						size === 'base' && 'px-3 py-1 text-sm',
						size === 'lg' && 'px-4 py-1.5 text-base',
						active
							? 'bg-primary text-primary-foreground border-primary shadow-sm hover:opacity-90'
							: 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
					)}
				>
					{#if active}
						<Check class="h-3 w-3 animate-in zoom-in-50" />
					{:else}
						<Bookmark class="h-3 w-3 opacity-60" />
					{/if}
					<span>{preset.label}</span>
				</button>
			{:else if variant === 'chips'}
				<button
					type="button"
					onclick={() => applyPreset(preset)}
					class={cn(
						'inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors text-xs select-none',
						size === 'sm' && 'px-2 py-0.5 text-xs',
						size === 'base' && 'px-3 py-1 text-sm',
						size === 'lg' && 'px-4 py-1.5 text-base',
						active
							? 'bg-accent text-accent-foreground font-semibold ring-1 ring-border'
							: 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
					)}
				>
					{#if active}
						<Check class="h-3 w-3" />
					{/if}
					<span>{preset.label}</span>
				</button>
			{:else}
				<Button
					variant={active ? 'default' : 'outline'}
					size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
					class="gap-1.5"
					onclick={() => applyPreset(preset)}
				>
					{#if active}
						<Check class="h-3.5 w-3.5" />
					{/if}
					<span>{preset.label}</span>
				</Button>
			{/if}
		{/each}
	</div>
</div>
