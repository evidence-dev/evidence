<script lang="ts">
	import { ChevronLeft, ChevronRight, Check } from 'lucide-svelte';
	import * as Popover from '../shadcn/components/ui/popover';
	import { cn } from '../shadcn/utils';
	import { getPageFiltersContext } from '../page-filters-context';
	import { PeriodFilter } from '../user-components/tags/workflow_period/PeriodFilter.svelte';
	import { WORKFLOW_PERIOD_FILTER_ID } from '../user-components/common/reporting-periods';

	interface Props {
		/** Render the selected period as a static label, for PDF and screenshot routes. */
		readonly?: boolean;
		class?: string;
	}

	let { readonly = false, class: className }: Props = $props();

	const pageFilters = getPageFiltersContext();

	// Undefined unless the page declared `workflow.period`, so every surface can
	// drop this in unconditionally.
	const filter = $derived.by(() => {
		const found = pageFilters?.get(WORKFLOW_PERIOD_FILTER_ID);
		return found instanceof PeriodFilter ? found : undefined;
	});

	const periods = $derived(filter?.periods ?? []);
	const selectedKey = $derived(filter?.period.key);
	const olderKey = $derived(filter?.olderPeriod?.key);
	const newerKey = $derived(filter?.newerPeriod?.key);

	let open = $state(false);

	function select(key: string | undefined) {
		if (!key || !filter) return;
		// A user interaction, so this writes to the URL — unlike setDefault().
		filter.value = { key };
		open = false;
	}

	// Segments of one control: the group owns the border and rounding, so each
	// segment is square and only the outer edges are rounded.
	const stepClass = 'inline-flex h-8 w-8 shrink-0 items-center justify-center transition-colors';
</script>

{#if filter}
	<div class={cn('flex justify-start', className)}>
		{#if readonly}
			<span class="text-muted-foreground text-sm font-medium tabular-nums">
				{filter.period.label}
			</span>
		{:else}
			<div
				class="inline-flex items-center overflow-hidden rounded-md border"
				aria-label="Reporting period"
			>
				<button
					type="button"
					class={cn(
						stepClass,
						olderKey ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/40 cursor-default'
					)}
					disabled={!olderKey}
					aria-label="Previous period"
					onclick={() => select(olderKey)}
				>
					<ChevronLeft class="h-4 w-4" />
				</button>

				<Popover.Root bind:open>
					<Popover.Trigger
						class="hover:bg-muted inline-flex h-8 min-w-32 items-center justify-center border-x px-3 text-sm font-medium tabular-nums transition-colors"
					>
						{filter.period.label}
					</Popover.Trigger>
					<Popover.Content class="max-h-72 w-48 overflow-auto p-1" align="start">
						{#each periods as period (period.key)}
							<button
								type="button"
								class={cn(
									'hover:bg-muted flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm tabular-nums',
									period.key === selectedKey && 'font-medium'
								)}
								onclick={() => select(period.key)}
							>
								{period.label}
								{#if period.key === selectedKey}
									<Check class="h-3.5 w-3.5" />
								{/if}
							</button>
						{/each}
					</Popover.Content>
				</Popover.Root>

				<button
					type="button"
					class={cn(
						stepClass,
						newerKey ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/40 cursor-default'
					)}
					disabled={!newerKey}
					aria-label="Next period"
					onclick={() => select(newerKey)}
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		{/if}
	</div>
{/if}
