<script>
	import {
		CalendarDate,
		DateFormatter,
		getLocalTimeZone,
		startOfMonth,
		endOfMonth,
		startOfYear,
		endOfYear
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/atoms/shadcn/button/index.js';
	import { RangeCalendar } from '$lib/atoms/shadcn/range-calendar/index.js';
	import * as Select from '$lib/atoms/shadcn/select/index.js';
	import * as Popover from '$lib/atoms/shadcn/popover/index.js';
	import { Separator } from '$lib/atoms/shadcn/separator/index.js';

	function YYYYMMDDToCalendar(yyyymmdd) {
		const pieces = yyyymmdd.split('-');
		return new CalendarDate(Number(pieces[0]), Number(pieces[1]), Number(pieces[2]));
	}

	const dfMedium = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	const dfShort = new DateFormatter('en-US', {
		dateStyle: 'short'
	});

	/** @type {import('bits-ui').DateRange | undefined} */
	export let selectedDateRange;
	/** @type {string} */
	export let start;
	/** @type {string} */
	export let end;
	export let loaded = true;

	$: calendarStart = YYYYMMDDToCalendar(start);
	$: calendarEnd = YYYYMMDDToCalendar(end);

	function updateDateRange(start, end) {
		selectedDateRange = { start, end };
	}

	$: updateDateRange(calendarStart, calendarEnd);

	/** @type {{label: string, group: string, range: import('bits-ui').DateRange}[]} */
	$: presets = [
		{
			label: 'Last 7 Days',
			group: 'Days',
			range: {
				start: calendarEnd.subtract({ days: 7 }),
				end: calendarEnd
			}
		},
		{
			label: 'Last 30 Days',
			group: 'Days',
			range: {
				start: calendarEnd.subtract({ days: 30 }),
				end: calendarEnd
			}
		},
		{
			label: 'Last 90 Days',
			group: 'Days',
			range: {
				start: calendarEnd.subtract({ days: 90 }),
				end: calendarEnd
			}
		},
		{
			label: 'Last 3 Months',
			group: 'Months',
			range: {
				start: startOfMonth(calendarEnd.subtract({ months: 3 })),
				end: endOfMonth(calendarEnd.subtract({ months: 1 }))
			}
		},
		{
			label: 'Last 6 Months',
			group: 'Months',
			range: {
				start: startOfMonth(calendarEnd.subtract({ months: 6 })),
				end: endOfMonth(calendarEnd.subtract({ months: 1 }))
			}
		},
		{
			label: 'Last 12 Months',
			group: 'Months',
			range: {
				start: startOfMonth(calendarEnd.subtract({ months: 12 })),
				end: endOfMonth(calendarEnd.subtract({ months: 1 }))
			}
		},
		{
			label: 'Last Month',
			group: 'Last',
			range: {
				start: startOfYear(calendarEnd.subtract({ years: 1 })),
				end: endOfYear(calendarEnd.subtract({ years: 1 }))
			}
		},
		{
			label: 'Last Year',
			group: 'Last',
			range: {
				start: startOfYear(calendarEnd.subtract({ years: 1 })),
				end: endOfYear(calendarEnd.subtract({ years: 1 }))
			}
		},
		{
			label: 'Month to Date',
			group: 'To Date',
			range: {
				start: startOfMonth(calendarEnd),
				end: endOfMonth(calendarEnd)
			}
		},
		{
			label: 'Year to Date',
			group: 'To Date',
			range: {
				start: startOfYear(calendarEnd),
				end: endOfYear(calendarEnd)
			}
		},
		{
			label: 'All Time',
			group: 'To Date',
			range: {
				start: calendarStart,
				end: calendarEnd
			}
		}
	];

	function setPlaceholderDefault(d) {
		placeholder = d;
	}

	let selectedPreset;
	let placeholder;
	$: setPlaceholderDefault(calendarEnd);
</script>

<div class="flex">
	<Popover.Root openFocus>
		<Popover.Trigger asChild let:builder>
			<Button
				variant="outline"
				size="sm"
				class={cn(
					'flex justify-start rounded-r-none border-r-0 text-left font-normal',
					!selectedDateRange && 'text-gray-400'
				)}
				builders={[builder]}
				disabled={!loaded}
			>
				<span class="hidden sm:inline">
					{#if !loaded}
						Loading...
					{:else if selectedDateRange && selectedDateRange.start}
						{#if selectedDateRange.end}
							{dfMedium.format(selectedDateRange.start.toDate(getLocalTimeZone()))} - {dfMedium.format(
								selectedDateRange.end.toDate(getLocalTimeZone())
							)}
						{:else}
							{dfMedium.format(selectedDateRange.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if placeholder}
						{dfMedium.format(placeholder.toDate(getLocalTimeZone()))}
					{:else}
						Date Range
					{/if}
				</span>
				<span class="sm:hidden">
					{#if !loaded}
						Loading...
					{:else if selectedDateRange && selectedDateRange.start}
						{#if selectedDateRange.end}
							{dfShort.format(selectedDateRange.start.toDate(getLocalTimeZone()))} - {dfShort.format(
								selectedDateRange.end.toDate(getLocalTimeZone())
							)}
						{:else}
							{dfShort.format(selectedDateRange.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if placeholder}
						{dfShort.format(placeholder.toDate(getLocalTimeZone()))}
					{:else}
						Date Range
					{/if}
				</span>
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-auto select-none p-0" align="start">
			<RangeCalendar
				bind:selectedDateRange
				bind:placeholder
				initialFocus
				numberOfMonths={1}
				onValueChange={(value) => {
					selectedPreset = undefined;
					selectedDateRange = value;
				}}
				minValue={calendarStart}
				maxValue={calendarEnd}
			/>
		</Popover.Content>
	</Popover.Root>

	<Select.Root
		onSelectedChange={(v) => {
			if (!v) return;
			selectedDateRange = presets.filter((presets) => presets.label == v.label)[0].range;
			selectedPreset = v;
		}}
		bind:selected={selectedPreset}
		disabled={!loaded}
	>
		<Select.Trigger class="h-8 w-40 rounded-l-none px-3 text-xs font-medium" sameWidth>
			{#if selectedPreset}
				{selectedPreset.label}
			{:else}
				<span class="hidden sm:inline"> Select a Range </span>
				<span class="sm:hidden"> Range </span>
			{/if}
		</Select.Trigger>
		<Select.Content>
			{#each presets.filter((d) => d.group === 'Days') as preset}
				<Select.Item value={preset.range} label={preset.label} class="text-xs"
					>{preset.label}</Select.Item
				>
			{/each}
			<Separator orientation="horizontal" />
			{#each presets.filter((d) => d.group === 'Months') as preset}
				<Select.Item value={preset.range} label={preset.label} class="text-xs"
					>{preset.label}</Select.Item
				>
			{/each}
			<Separator orientation="horizontal" />
			{#each presets.filter((d) => d.group === 'Last') as preset}
				<Select.Item value={preset.range} label={preset.label} class="text-xs"
					>{preset.label}</Select.Item
				>
			{/each}
			<Separator orientation="horizontal" />
			{#each presets.filter((d) => d.group === 'To Date') as preset}
				<Select.Item value={preset.range} label={preset.label} class="text-xs"
					>{preset.label}</Select.Item
				>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
