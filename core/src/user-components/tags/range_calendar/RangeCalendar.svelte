<script lang="ts">
	import { Calendar, Sun } from 'lucide-svelte';
	import * as Popover from '../../../shadcn/components/ui/popover';
	import { RangeCalendar } from '../../../shadcn/components/ui/range-calendar';
	import { Button } from '../../../shadcn/components/ui/button';
	import { cn } from '../../../shadcn/utils';
	import { Label } from '../../../shadcn/components/ui/label';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import type { UserComponentProps } from '../../types';
	import type { RangeCalendarFilter } from './RangeCalendarFilter.svelte';
	import { schema } from './schema';
	import formatTitle from '../../formatTitle';
	import {
		PRESET_DEFINITIONS,
		DEFAULT_VISIBLE_PRESET_DEFINITIONS,
		processDateRange
	} from '../../common/date-options';
	import {
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		type DateValue,
		today
	} from '@internationalized/date';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { expandCustomRanges, type CustomRangeRule } from '../../common/custom-ranges';
	import Ellipsis from '../../../viewer-components/Ellipsis.svelte';

	// Props using UserComponentProps
	const props: UserComponentProps<typeof schema> = $props();

	// Get project settings for first day of week
	const getProjectSettings = getProjectSettingsContext();
	const projectSettings = $derived(getProjectSettings());
	const firstDayOfWeek = $derived(projectSettings.first_day_of_week || 'sunday');

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
	const width = $derived(props.width);
	const explicitDefault = $derived(
		resolveText(props.default_range) ?? props.default_range ?? props.defaultRange
	);
	const defaultRange = $derived(explicitDefault ?? 'all time');
	const presetRanges = $derived(props.preset_ranges);

	// Date formatter for display
	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	// Get the filter for this component
	const filter = $derived(
		id ? (pageFilters?.get(id) as RangeCalendarFilter | undefined) : undefined
	);

	// Get anchor date for date range calculations
	const anchorDate = $derived(
		projectSettings.computedDefaultDateRangeEnd
			? parseDateStringAsLocalMidnight(projectSettings.computedDefaultDateRangeEnd)
			: new Date()
	);

	// Presets generated from `custom_ranges` (fiscal years, seasons, …), anchored on `anchorDate`.
	const generatedPresets = $derived(
		expandCustomRanges(
			props.custom_ranges as CustomRangeRule[] | undefined,
			anchorDate,
			firstDayOfWeek
		)
	);

	// Internal state for the date range - derived from filter value
	let startValue = $derived.by(() => {
		if (!filter?.value || typeof filter.value !== 'object') return undefined;
		const { range } = filter.value;
		const iso = range
			? processDateRange(range, undefined, anchorDate, firstDayOfWeek).startDate
			: undefined;
		if (!iso) return undefined;
		try {
			return parseDate(iso);
		} catch {
			return undefined;
		}
	});

	let endValue = $derived.by(() => {
		if (!filter?.value || typeof filter.value !== 'object') return undefined;
		const { range } = filter.value;
		const iso = range
			? processDateRange(range, undefined, anchorDate, firstDayOfWeek).endDate
			: undefined;
		if (!iso) return undefined;
		try {
			return parseDate(iso);
		} catch {
			return undefined;
		}
	});

	// Built-in presets (per preset_ranges) plus any generated custom_ranges.
	// preset_ranges unset → default visible set; preset_ranges=[] → no built-ins (custom_ranges still show).
	const filteredPresets = $derived.by(() => {
		const base = DEFAULT_VISIBLE_PRESET_DEFINITIONS.map(({ key, label }) => ({ key, label }));
		let builtins: { key: string; label: string }[];
		if (!presetRanges) {
			// If a hidden preset is explicitly used as default, include it for this component instance.
			const defaultPreset = defaultRange
				? PRESET_DEFINITIONS.find((preset) => preset.key === defaultRange)
				: undefined;
			builtins =
				defaultPreset && !base.some((preset) => preset.key === defaultPreset.key)
					? [...base, { key: defaultPreset.key, label: defaultPreset.label }]
					: base;
		} else {
			builtins = PRESET_DEFINITIONS.filter((preset) => presetRanges.includes(preset.key)).map(
				({ key, label }) => ({ key, label })
			);
		}
		return [...builtins, ...generatedPresets];
	});

	let selectedPreset = $derived.by(() => {
		if (!filter?.value || typeof filter.value !== 'object') return 'All Time';
		const { range } = filter.value as { range?: string };
		if (!range || range === 'all time') return 'All Time';
		// If matches a preset, show label; otherwise null for custom
		const matchingPreset = filteredPresets.find((p) => p.key === range);
		return matchingPreset ? matchingPreset.label : null;
	});

	let isPopoverOpen = $state(false);
	let isComponentMounted = $state(false);

	// Check if we have a selection
	const hasSelection = $derived(Boolean(startValue || endValue));

	// Mobile view state
	let mobileView = $state<'presets' | 'calendar'>('presets');

	// Delay popover initialization to prevent layout shifts during hydration
	$effect(() => {
		const timer = setTimeout(() => {
			isComponentMounted = true;
		}, 100);

		return () => clearTimeout(timer);
	});

	// Date range presets - imported from shared presets file

	// Apply preset by setting range string; mobile flow can request closing
	function applyPreset(preset: { key: string; label: string }, closeMobile = false) {
		if (!filter) return;
		if (closeMobile) {
			isPopoverOpen = false;
			mobileView = 'presets';
		}
		filter.value = { range: preset.key };
	}

	// Fall back to a default only when no value exists. An explicit default_range — including a
	// custom_ranges label — is already resolved into filter.value by RangeCalendarFilter's constructor.
	let initialized = false;
	$effect(() => {
		if (!filter || initialized) return;

		if (!filter.value) {
			const presets = filteredPresets;
			const key = presets.find((p) => p.key === 'all time')?.key ?? presets[0]?.key ?? 'all time';
			filter.setDefault({ range: key });
		}

		initialized = true;
	});

	// Current range value for the calendar
	const currentRange = $derived({ start: startValue, end: endValue });

	// Calendar placeholder - initialize to today to avoid undefined errors in calendar dropdown
	let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));

	// Handle range selection from calendar
	function handleRangeSelect(
		range: { start: DateValue | undefined; end: DateValue | undefined } | undefined
	) {
		if (!filter) return;

		if (range) {
			// Update filter directly when user selects dates
			const s = range.start ? range.start.toString() : undefined;
			const e = range.end ? range.end.toString() : undefined;
			let rangeStr: string | undefined;
			if (s && e) {
				// Ensure order
				rangeStr = `${s} to ${e}`;
			} else if (s) {
				rangeStr = `from ${s}`;
			} else if (e) {
				rangeStr = `until ${e}`;
			} else {
				rangeStr = 'all time';
			}
			filter.value = { range: rangeStr };
		} else {
			// Clear selection
			filter.value = { range: 'all time' };
		}
	}

	// Select today as a single-day range
	function selectToday() {
		const d = today(getLocalTimeZone());
		calendarPlaceholder = d;
		handleRangeSelect({ start: d, end: d });
	}

	// Format the display text
	function getDisplayText(): string {
		// If a preset is selected, show the preset name
		if (selectedPreset) {
			return selectedPreset;
		}

		if (!startValue && !endValue) {
			return 'All Time';
		}

		if (startValue && endValue) {
			return `${df.format(startValue.toDate(getLocalTimeZone()))} - ${df.format(endValue.toDate(getLocalTimeZone()))}`;
		}

		if (startValue) {
			return `From ${df.format(startValue.toDate(getLocalTimeZone()))}`;
		}

		if (endValue) {
			return `Until ${df.format(endValue.toDate(getLocalTimeZone()))}`;
		}

		return 'All Time';
	}

	// Reset mobile view when popover opens
	$effect(() => {
		if (isPopoverOpen) {
			mobileView = 'presets';
		}
	});
</script>

<div class="mb-4 flex w-full flex-col" style:width>
	{#if title}
		<Label for={id} class="mb-2">
			{title ?? formatTitle(id)}
		</Label>
	{/if}

	<div class="mt-auto">
		{#if isComponentMounted}
			<Popover.Root bind:open={isPopoverOpen}>
				<Popover.Trigger class="w-full">
					{#snippet child({ props })}
						<Button
							{...props}
							{id}
							variant="outline"
							class={cn(
								'bg-input-surface hover:bg-accent/30 w-full justify-start text-left font-normal'
							)}
						>
							<Calendar class="text-muted-foreground mr-1 size-3.5" />
							<span
								class={cn(
									hasSelection || selectedPreset === 'All Time'
										? 'text-foreground'
										: 'text-muted-foreground'
								)}
							>
								{getDisplayText()}
							</span>
						</Button>
					{/snippet}
				</Popover.Trigger>

				<Popover.Content
					class="evidence-page-theme w-auto max-w-[95vw] p-0 sm:max-w-none"
					align="start"
				>
					<div class="flex">
						<!-- Desktop: Show presets sidebar -->
						<div class="hidden w-[160px] shrink-0 border-r lg:block">
							<div class="px-2 py-2">
								<div class="max-h-[375px] space-y-1 overflow-y-auto">
									{#each filteredPresets as preset}
										<Button
											variant={selectedPreset === preset.label ? 'secondary' : 'ghost'}
											size="sm"
											class="w-full justify-start font-normal"
											onclick={() => applyPreset(preset)}
										>
											<Ellipsis class="min-w-0 flex-1">{preset.label}</Ellipsis>
										</Button>
									{/each}
								</div>
							</div>
						</div>

						<div class="flex-1">
							<!-- Mobile: Conditional view -->
							<div class="lg:hidden">
								{#if mobileView === 'presets'}
									<!-- Mobile preset list -->
									<div class="max-h-[300px] min-w-[240px] space-y-1 overflow-y-auto p-2">
										{#each filteredPresets as preset}
											<Button
												variant={selectedPreset === preset.label ? 'secondary' : 'ghost'}
												size="sm"
												class="w-full justify-start font-normal"
												onclick={() => applyPreset(preset)}
											>
												<Ellipsis class="min-w-0 flex-1">{preset.label}</Ellipsis>
											</Button>
										{/each}
										<div class="my-2 border-t"></div>
										<Button
											variant="ghost"
											size="sm"
											class="w-full justify-start font-normal"
											onclick={() => (mobileView = 'calendar')}
										>
											Custom Range...
										</Button>
									</div>
								{:else}
									<!-- Mobile calendar view -->
									<div class="p-3">
										<div class="mb-3">
											<Button variant="ghost" size="sm" onclick={() => (mobileView = 'presets')}>
												← Back to presets
											</Button>
										</div>
										<div class="w-fit">
											<RangeCalendar
												value={currentRange}
												onValueChange={handleRangeSelect}
												numberOfMonths={1}
												captionLayout="dropdown-years"
												disableDaysOutsideMonth={true}
												placeholder={calendarPlaceholder}
												class="[&_[data-outside-month]]:pointer-events-none [&_[data-outside-month]]:!bg-transparent [&_[data-outside-month]]:!text-transparent"
											/>
										</div>
										<div class="mt-3 flex justify-between gap-2">
											<Button variant="ghost" size="sm" onclick={selectToday}>
												<Sun class="size-3.5" />
												Today
											</Button>
											<div class="flex gap-2">
												<Button
													variant="ghost"
													size="sm"
													disabled={!startValue && !endValue}
													onclick={() => {
														if (filter) {
															filter.value = { range: 'all time' };
														}
													}}
												>
													Clear
												</Button>
												<Button
													variant="secondary"
													size="sm"
													onclick={() => {
														isPopoverOpen = false;
														mobileView = 'presets';
													}}
												>
													Done
												</Button>
											</div>
										</div>
									</div>
								{/if}
							</div>

							<!-- Desktop: Calendar only -->
							<div class="hidden px-6 py-4 lg:block">
								<RangeCalendar
									value={currentRange}
									onValueChange={handleRangeSelect}
									numberOfMonths={2}
									captionLayout="dropdown"
									pagedNavigation={true}
									fixedWeeks={true}
									disableDaysOutsideMonth={true}
									placeholder={calendarPlaceholder}
									class="p-0 [&_[data-outside-month]]:pointer-events-none [&_[data-outside-month]]:!bg-transparent [&_[data-outside-month]]:!text-transparent"
								/>
								<div class="mt-3 flex justify-between gap-2">
									<Button variant="ghost" size="sm" onclick={selectToday}>
										<Sun class="size-3.5" />
										Today
									</Button>
									<div class="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											disabled={!startValue && !endValue}
											onclick={() => {
												if (filter) {
													filter.value = { range: 'all time' };
												}
											}}
										>
											Clear
										</Button>
										<Button
											variant="secondary"
											size="sm"
											onclick={() => {
												isPopoverOpen = false;
											}}
										>
											Done
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Popover.Content>
			</Popover.Root>
		{:else}
			<!-- Static button during initialization to prevent layout shifts -->
			<Button
				{id}
				variant="outline"
				disabled
				class={cn('w-full justify-start text-left font-normal', 'opacity-50')}
			>
				<Calendar class="text-muted-foreground mr-1 size-3.5" />
				<span class="text-foreground">
					{getDisplayText()}
				</span>
			</Button>
		{/if}
	</div>
</div>

<style>
	/* Windows paints the native month/year dropdown with the OS light scheme,
	   which clashes with dark themes. */
	:global(.dark [class~='group/calendar'] select) {
		color-scheme: dark;
	}
	/* Themed reports can render dark without `.dark`, so paint options directly. */
	:global([class~='group/calendar'] select option) {
		background-color: var(--popover);
		color: var(--popover-foreground);
	}
	/* Fallback popup tinting for browsers without base-select (e.g. Firefox). */
	:global([class~='group/calendar'] select) {
		background-color: var(--popover);
		scrollbar-color: var(--muted-foreground) var(--popover);
	}
	/* Chromium's UA-drawn popup ignores author scrollbar styling; base-select
	   renders it as a DOM popover we fully control, scrollbar included. */
	@supports (appearance: base-select) {
		:global([class~='group/calendar'] select),
		:global([class~='group/calendar'] select::picker(select)) {
			appearance: base-select;
		}
		:global([class~='group/calendar'] select::picker(select)) {
			background: var(--popover);
			color: var(--popover-foreground);
			border: 1px solid var(--border);
			border-radius: 8px;
			scrollbar-color: var(--muted-foreground) transparent;
		}
		:global([class~='group/calendar'] select option) {
			padding: 4px 8px;
		}
	}
</style>
