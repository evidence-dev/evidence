<script context="module">
	export const evidenceInclude = true;
</script>

<script lang="ts">
	import { Calendar as CalendarIcon } from 'radix-icons-svelte';
	import type { DateRange } from 'bits-ui';
	import {
		CalendarDate,
		DateFormatter,
		getLocalTimeZone,
		today,
		startOfMonth,
		endOfMonth,
		startOfWeek,
		startOfYear,
		type DateValue
	} from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/atoms/shadcn/button';
	import { RangeCalendar } from '$lib/atoms/shadcn/range-calendar';
	import * as Select from '$lib/atoms/shadcn/select';
	import * as Popover from '$lib/atoms/shadcn/popover';

	const dfMedium = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	const dfShort = new DateFormatter('en-US', {
		dateStyle: 'short'
	});

	let selectedDateRange: DateRange | undefined = {
		start: today(getLocalTimeZone()),
		end: today(getLocalTimeZone())
	};

	let startValue: DateValue | undefined = selectedDateRange.start;

	type Preset = {
		label: string;
		range: DateRange;
	};

	const presets: Array<Preset> = [
		{
			label: 'Last 7 Days',
			range: {
				start: today(getLocalTimeZone()).subtract({ days: 7 }),
				end: today(getLocalTimeZone())
			}
		},
		{
			label: 'Last 12 Months',
			range: {
				start: startOfMonth(today(getLocalTimeZone()).subtract({ months: 12 })),
				end: endOfMonth(today(getLocalTimeZone()).subtract({ months: 1 }))
			}
		}
	];

	let selectedPreset: Preset | undefined = undefined;
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
			>
				<CalendarIcon class="mr-2 h-4 w-4" />
				<span class="hidden sm:inline">
					{#if selectedDateRange && selectedDateRange.start}
						{#if selectedDateRange.end}
							{dfMedium.format(selectedDateRange.start.toDate(getLocalTimeZone()))} - {dfMedium.format(
								selectedDateRange.end.toDate(getLocalTimeZone())
							)}
						{:else}
							{dfMedium.format(selectedDateRange.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if startValue}
						{dfMedium.format(startValue.toDate(getLocalTimeZone()))}
					{:else}
						Date Range
					{/if}
				</span>
				<span class="sm:hidden">
					{#if selectedDateRange && selectedDateRange.start}
						{#if selectedDateRange.end}
							{dfShort.format(selectedDateRange.start.toDate(getLocalTimeZone()))} - {dfShort.format(
								selectedDateRange.end.toDate(getLocalTimeZone())
							)}
						{:else}
							{dfShort.format(selectedDateRange.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if startValue}
						{dfShort.format(startValue.toDate(getLocalTimeZone()))}
					{:else}
						Date Range
					{/if}
				</span>
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-auto select-none p-0" align="start">
			<RangeCalendar
				bind:value={selectedDateRange}
				placeholder={startValue}
				initialFocus
				numberOfMonths={1}
				onValueChange={() => {
					selectedPreset = undefined;
				}}
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
			{#each presets as preset}
				<Select.Item value={preset.range} label={preset.label} class="text-xs"
					>{preset.label}</Select.Item
				>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
