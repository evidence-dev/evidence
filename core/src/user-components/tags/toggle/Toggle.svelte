<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { type Filter } from '../../../Filter.svelte';
	import { Label } from '../../../shadcn/components/ui/label';
	import { Switch } from '../../../shadcn/components/ui/switch';
	import Info from '../info/Info.svelte';
	import formatTitle from '../../formatTitle';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
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
	const label = $derived(resolveText(props.label) ?? formatTitle(id));
	const info = $derived(resolveText(props.info));
	const initialValue = $derived(props.initial_value ?? false);

	let filter: Filter<boolean> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<boolean> | undefined) : undefined
	);

	$effect(() => {
		if (filter && filter.value === undefined) {
			filter.setDefault(initialValue);
		}
	});

	const checked = $derived(filter?.value ?? false);

	const handleChange = (value: boolean) => {
		if (filter) {
			filter.value = value;
		}
	};
</script>

<div class="flex cursor-default flex-col">
	{#if filter}
		<div class="relative mt-auto mb-3 max-w-full min-w-0 cursor-default pb-1">
			<div
				class={`border-input flex h-9 w-fit cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm shadow-xs transition-colors print:shadow-none ${
					checked
						? 'bg-primary/[0.03] dark:bg-input/50'
						: 'bg-input-surface hover:bg-accent/30'
				}`}
				onclick={(e) => {
					// Don't toggle if clicking on the info icon
					if (!(e.target as HTMLElement).closest('[data-info-icon]')) {
						handleChange(!checked);
					}
				}}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleChange(!checked);
					}
				}}
			>
				<Label for={id} class="pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
					{label}
					{#if info}
						<span class="pointer-events-auto flex items-center" data-info-icon>
							<Info text={info} className="pb-0" />
						</span>
					{/if}
				</Label>
				<Switch
					{id}
					{checked}
					onCheckedChange={handleChange}
					class="data-[state=checked]:bg-primary pointer-events-none"
				/>
			</div>
		</div>
	{/if}
</div>
