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
	import { Calendar } from '$lib/atoms/shadcn/calendar/index.js';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CalendarOutline as CalendarIcon } from '@steeze-ui/custom-icons';

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
	export let selectedDateInput = undefined;
	/** @type {string} */
	export let start;
	/** @type {string} */
	export let end;
	export let loaded = true;
	/** @type {[]string] | undefined} */
	export let presetRanges;
	/** @type {string] | undefined} */
	export let defaultValue;
	/** @type {boolean} */
	export let range = false;
	/** @type {string} */
	export let title;

	/** @type { { label: string, group: string, range: import('bits-ui').DateRange }[] } */
	$: presets = [
		{
			label: 'Last 7 Days',
			group: 'Days',
			range: {
				start: calendarEnd.subtract({ days: 6 }),
				end: calendarEnd
			}
		},
		{
			label: 'Last 30 Days',
			group: 'Days',
			range: {
				start: calendarEnd.subtract({ days: 29 }),
				end: calendarEnd
			}
		},
		{
			label: 'Last 90 Days',
			group: 'Days',
			range: {
				start: calendarEnd.subtract({ days: 89 }),
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
				start: startOfMonth(calendarEnd.subtract({ months: 1 })),
				end: endOfMonth(calendarEnd.subtract({ months: 1 }))
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

	function lowerCaseNoSpaceString(unformattedStr) {
		return unformattedStr.toString().toLowerCase().replace(/\s+/g, '');
	}

	$: {
		if (typeof presetRanges === 'string') {
			presetRanges = [presetRanges];
		}

		if (presetRanges && typeof presetRanges[0] === 'string') {
			//filters out present range strings matching in preset array to be displayed to user
			const formattedPresetRanges = presetRanges.map((preset) => lowerCaseNoSpaceString(preset));

			let filteredPresets = presets.filter((preset) => {
				return formattedPresetRanges.includes(lowerCaseNoSpaceString(preset.label));
			});
			presets = filteredPresets;
		}
	}

	function setPlaceholderDefault(d) {
		placeholder = d;
	}

	let selectedPreset;
	let placeholder;
	$: setPlaceholderDefault(calendarEnd);

	// group exists check for nicely rendering group border for dropdown
	function groupExists(groupName) {
		return presets.some((preset) => preset.group === groupName);
	}

	/**
	 * @param {typeof presets[number] | string} v
	 */
	function applyPreset(v) {
		if (!v) return;
		const targetPreset = presets.find(
			(preset) =>
				lowerCaseNoSpaceString(preset.label) ===
				lowerCaseNoSpaceString(typeof v === 'string' ? v : v.label)
		);
		if (!targetPreset) return;
		selectedPreset = targetPreset;
		if (range) {
			selectedDateInput = targetPreset.range ?? targetPreset.value;
		} else {
			selectedDateInput = targetPreset.range;
		}
	}

	$: if (
		typeof defaultValue === 'string' &&
		!selectedDateInput &&
		!selectedPreset &&
		presets.length
	)
		applyPreset(defaultValue);

	$: calendarStart = YYYYMMDDToCalendar(start);
	$: calendarEnd = YYYYMMDDToCalendar(end);

	function updateDateRange(start, end) {
		if (selectedPreset) return;

		if (range) {
			selectedDateInput = { start, end };
		} else {
			selectedDateInput = start;
		}
	}
	$: updateDateRange(calendarStart, calendarEnd);
</script>

<div class="flex bg-[white]">
	<Popover.Root openFocus>
		<Popover.Trigger asChild let:builder>
			<Button
				variant="outline"
				size="sm"
				class={cn(
					`flex justify-start ${range ? 'border-r rounded-r-none text-left' : 'text-center'} font-normal`,
					!selectedDateInput && 'text-gray-400'
				)}
				builders={[builder]}
				disabled={!loaded}
			>
				<span class="hidden sm:flex font-medium items-center">
					{#if !loaded}
						Loading...
					{:else if selectedDateInput && !range}
						{#if title}
							{title}
							<Separator oritentation="vertical" class="mx-2 h-4 w-[1px]" />
						{/if}
						{dfMedium.format(selectedDateInput.toDate(getLocalTimeZone()))}
						<span class="ml-2 mb-[2px]">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<rect x="4" y="5" width="16" height="16" rx="2" />
								<path d="M4 11h16" />

								<path d="M8 3v4" />
								<path d="M16 3v4" />
							</svg>
						</span>
					{:else if selectedDateInput && selectedDateInput.start}
						{#if selectedDateInput.end}
							{dfMedium.format(selectedDateInput.start.toDate(getLocalTimeZone()))} - {dfMedium.format(
								selectedDateInput.end.toDate(getLocalTimeZone())
							)}
						{:else}
							{dfMedium.format(selectedDateInput.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if placeholder}
						{dfMedium.format(placeholder.toDate(getLocalTimeZone()))}
					{:else}
						Date Input
					{/if}
				</span>
				<span class="sm:hidden flex items-center">
					{#if !loaded}
						Loading...
					{:else if selectedDateInput && !range}
						{dfShort.format(selectedDateInput.toDate(getLocalTimeZone()))}
						<span class="ml-2 mb-[2px]">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<rect x="4" y="5" width="16" height="16" rx="2" />
								<path d="M4 11h16" />

								<path d="M8 3v4" />
								<path d="M16 3v4" />
							</svg>
						</span>
					{:else if selectedDateInput && selectedDateInput.start}
						{#if selectedDateInput.end}
							{dfShort.format(selectedDateInput.start.toDate(getLocalTimeZone()))} - {dfShort.format(
								selectedDateInput.end.toDate(getLocalTimeZone())
							)}
						{:else}
							{dfShort.format(selectedDateInput.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if placeholder}
						{dfShort.format(placeholder.toDate(getLocalTimeZone()))}
					{:else}
						Date Input
					{/if}
				</span>
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-auto select-none p-0" align="start">
			{#if range}
				<RangeCalendar
					bind:selectedDateInput
					bind:placeholder
					initialFocus
					numberOfMonths={1}
					onValueChange={(value) => {
						selectedPreset = undefined;
						selectedDateInput = value;
					}}
					minValue={calendarStart}
					maxValue={calendarEnd}
				/>
			{:else}
				<Calendar
					bind:selectedDateInput
					bind:placeholder
					initialFocus
					numberOfMonths={1}
					onValueChange={(value) => {
						selectedPreset = undefined;
						selectedDateInput = value;
					}}
					minValue={calendarStart}
					maxValue={calendarEnd}
				/>
			{/if}
		</Popover.Content>
	</Popover.Root>
	{#if range}
		<Select.Root
			onSelectedChange={(v) => {
				v.range = v.value;
				applyPreset(v);
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
			{#if presets && presets.length === 0}
				<Select.Content class="text-sm text-center">
					<p>No Valid Presets</p>
				</Select.Content>
			{:else}
				<Select.Content>
					{#each presets.filter((d) => d.group === 'Days') as preset}
						<Select.Item value={preset.range} label={preset.label} class="text-xs"
							>{preset.label}</Select.Item
						>
					{/each}
					{#if groupExists('Months')}
						<Separator orientation="horizontal" />
					{/if}
					{#each presets.filter((d) => d.group === 'Months') as preset}
						<Select.Item value={preset.range} label={preset.label} class="text-xs"
							>{preset.label}</Select.Item
						>
					{/each}
					{#if groupExists('Last')}
						<Separator orientation="horizontal" />
					{/if}
					{#each presets.filter((d) => d.group === 'Last') as preset}
						<Select.Item value={preset.range} label={preset.label} class="text-xs"
							>{preset.label}</Select.Item
						>
					{/each}
					{#if groupExists('To Date')}
						<Separator orientation="horizontal" />
					{/if}
					{#each presets.filter((d) => d.group === 'To Date') as preset}
						<Select.Item value={preset.range} label={preset.label} class="text-xs"
							>{preset.label}</Select.Item
						>
					{/each}
				</Select.Content>
			{/if}
		</Select.Root>
	{/if}
</div>
