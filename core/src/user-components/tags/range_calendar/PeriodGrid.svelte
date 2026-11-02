<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { format } from 'date-fns';
	import { buttonVariants } from '../../../shadcn/components/ui/button';
	import { cn } from '../../../shadcn/utils';
	import type { PeriodCalendar } from '../../common/period-calendar';
	import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';

	/**
	 * A grid of months, quarters or years for `range_calendar` at those grains. The first click
	 * selects one period; the next click extends the selection to the clicked period (either
	 * direction), and the click after that starts over.
	 */
	let {
		grain,
		calendar,
		start,
		end,
		today,
		panels = 1,
		onSelect
	}: {
		grain: 'month' | 'quarter' | 'year';
		calendar: PeriodCalendar;
		/** First day of the selection (ISO), already a period start. */
		start?: string;
		/** Last day of the selection (ISO), already a period end. */
		end?: string;
		/** The period containing this date is marked as the current one (the project's "now"). */
		today: Date;
		/** Years shown side by side, or 12-year pages at year grain. */
		panels?: number;
		onSelect: (bounds: { start: string; end: string }) => void;
	} = $props();

	const YEARS_PER_PAGE = 12;
	const toIso = (date: Date) => format(date, 'yyyy-MM-dd');

	// Open on the selection's last year (else today's), in the last panel, with earlier years before it.
	// At year grain, that year sits near the end of its page so the next couple of years still show.
	function initialFirstYear(): number {
		const focus = end ?? start;
		const year = (focus ? parseDateStringAsLocalMidnight(focus) : today).getFullYear();
		return grain === 'year'
			? year - (YEARS_PER_PAGE - 3) - YEARS_PER_PAGE * (panels - 1)
			: year - (panels - 1);
	}

	let firstYear = $state(initialFirstYear());
	/** Start of the period clicked first, while waiting for the click that extends the selection. */
	let pending = $state<Date | undefined>(undefined);
	let hovered = $state<Date | undefined>(undefined);

	const yearsPerPanel = $derived(grain === 'year' ? YEARS_PER_PAGE : 1);

	type Cell = { start: Date; iso: string; endIso: string; text: string; detail?: string };

	function cell(periodStart: Date): Cell {
		const periodEnd = calendar.endOf(periodStart, grain);
		return {
			start: periodStart,
			iso: toIso(periodStart),
			endIso: toIso(periodEnd),
			text: calendar.shortLabel(periodStart, grain),
			detail:
				grain === 'quarter'
					? `${format(periodStart, 'MMM')} – ${format(periodEnd, 'MMM')}`
					: undefined
		};
	}

	// Every period in a panel, stepping through the calendar so a non-January year would still work.
	const panelList = $derived(
		Array.from({ length: panels }, (_, index) => {
			const firstOfPanel = calendar.startOf(
				new Date(firstYear + index * yearsPerPanel, 0, 1),
				'year'
			);
			const lastDay = toIso(
				calendar.endOf(calendar.shift(firstOfPanel, 'year', yearsPerPanel - 1), 'year')
			);
			const cells: Cell[] = [];
			for (
				let periodStart = firstOfPanel;
				toIso(periodStart) <= lastDay;
				periodStart = calendar.shift(periodStart, grain, 1)
			) {
				cells.push(cell(periodStart));
			}
			const title =
				grain === 'year'
					? `${cells[0].text} – ${cells[cells.length - 1].text}`
					: calendar.label(firstOfPanel, 'year');
			return { title, cells };
		})
	);

	const preview = $derived.by(() => {
		if (!pending || !hovered) return undefined;
		const [first, last] = pending <= hovered ? [pending, hovered] : [hovered, pending];
		return { start: toIso(first), end: toIso(calendar.endOf(last, grain)) };
	});

	const todayIso = $derived(toIso(today));

	function within(c: Cell, range: { start?: string; end?: string } | undefined): boolean {
		if (!range || (!range.start && !range.end)) return false;
		return (!range.start || c.iso >= range.start) && (!range.end || c.endIso <= range.end);
	}

	function select(c: Cell) {
		if (pending) {
			const [first, last] = pending <= c.start ? [pending, c.start] : [c.start, pending];
			pending = undefined;
			onSelect({ start: toIso(first), end: toIso(calendar.endOf(last, grain)) });
		} else {
			pending = c.start;
			onSelect({ start: c.iso, end: c.endIso });
		}
	}

	const navClass = cn(
		buttonVariants({ variant: 'ghost' }),
		'size-8 bg-transparent p-0 select-none'
	);
</script>

<div class="relative" data-period-grid data-grain={grain}>
	<div class="absolute inset-x-0 top-0 flex items-center justify-between">
		<button
			type="button"
			class={navClass}
			aria-label="Show earlier periods"
			onclick={() => (firstYear -= yearsPerPanel * panels)}
		>
			<ChevronLeft class="size-4" />
		</button>
		<button
			type="button"
			class={navClass}
			aria-label="Show later periods"
			onclick={() => (firstYear += yearsPerPanel * panels)}
		>
			<ChevronRight class="size-4" />
		</button>
	</div>
	<div
		class="flex flex-col gap-4 md:flex-row"
		role="presentation"
		onmouseleave={() => (hovered = undefined)}
	>
		{#each panelList as panel (panel.title)}
			<div class="flex w-56 flex-col">
				<div class="flex h-8 items-center justify-center text-sm font-medium">{panel.title}</div>
				<div
					class={cn('mt-2 grid gap-1', grain === 'quarter' ? 'grid-cols-2' : 'grid-cols-3')}
					role="group"
					aria-label={panel.title}
				>
					{#each panel.cells as c (c.iso)}
						{@const selected = within(c, { start, end })}
						{@const isEndpoint = selected && (c.iso === start || c.endIso === end)}
						{@const highlighted = !selected && within(c, preview)}
						<button
							type="button"
							data-period-cell
							data-value={c.iso}
							data-selected={selected || undefined}
							data-range-start={(selected && c.iso === start) || undefined}
							data-range-end={(selected && c.endIso === end) || undefined}
							data-highlighted={highlighted || undefined}
							data-current={(c.iso <= todayIso && todayIso <= c.endIso) || undefined}
							aria-pressed={selected}
							aria-label={calendar.label(c.start, grain)}
							class={cn(
								buttonVariants({ variant: 'ghost' }),
								'h-auto min-h-9 flex-col gap-0 px-1 py-1.5 leading-tight font-normal',
								'data-[current]:ring-ring/60 data-[current]:ring-1 data-[current]:ring-inset',
								// Picked in code rather than with data-* variants, whose CSS order would decide the winner.
								isEndpoint &&
									'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
								selected && !isEndpoint && 'bg-accent text-accent-foreground',
								highlighted && 'bg-accent/60'
							)}
							onclick={() => select(c)}
							onmouseenter={() => (hovered = c.start)}
							onfocus={() => (hovered = c.start)}
						>
							<span>{c.text}</span>
							{#if c.detail}
								<span class="text-xs opacity-70">{c.detail}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
