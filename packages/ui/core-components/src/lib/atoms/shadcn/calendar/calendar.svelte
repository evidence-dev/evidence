<script>
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import {
		Day,
		Cell,
		Grid,
		Header,
		Months,
		GridRow,
		Heading,
		GridBody,
		GridHead,
		HeadCell,
		NextButton,
		PrevButton
	} from './index.js';
	import * as Select from '../select/index.js';
	import { Select as SelectPrimitive } from 'bits-ui';
	import { DateFormatter, getLocalTimeZone } from '@internationalized/date';

	import { cn } from '$lib/utils.js';

	/** @type {import("bits-ui").DateRange | undefined} */
	let value = undefined;
	/** @type {DateValue | undefined} */
	let placeholder = undefined;
	/** @type {{ start: DateValue; end: DateValue; } | undefined} */
	let selectedDateInput = undefined;
	/** @type {'short' | 'long' | undefined} */
	let weekdayFormat = 'short';
	/** @type {DateValue | undefined} */
	let startValue = undefined;
	/** @type {CalendarDate | undefined} */
	let minValue = undefined;
	/** @type {CalendarDate | undefined} */
	let maxValue = undefined;
	/** @type {number[] | undefined} */
	let availableYears = undefined;

	/** @type {string | undefined | null} */
	let className = undefined;

	const monthOptions = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	].map((month, i) => ({ value: i + 1, label: month }));

	const monthFmt = new DateFormatter('en-US', {
		month: 'long'
	});

	// Create year options based on available years from data
	$: yearOptions = (() => {
		if (availableYears?.length > 0) {
			return availableYears
				.sort((a, b) => b - a)
				.map(year => ({ label: String(year), value: year }))
				.filter(({ value }) => !(minValue?.year > value || value > maxValue?.year));
		}
	})();

	$: defaultYear = placeholder
		? { value: placeholder.year, label: String(placeholder.year) }
		: undefined;

	$: defaultMonth = placeholder
		? { value: placeholder.month, label: monthFmt.format(placeholder.toDate(getLocalTimeZone())) }
		: undefined;

	export {
		className as class,
		value,
		placeholder,
		weekdayFormat,
		startValue,
		selectedDateInput,
		minValue,
		maxValue,
		availableYears,
	};
</script>

<CalendarPrimitive.Root
	bind:value
	bind:placeholder
	bind:startValue
	bind:selectedDateInput
	{minValue}
	{maxValue}
	{weekdayFormat}
	class={cn('p-3', className)}
	{...$$restProps}
	on:keydown
	let:months
	let:weekdays
>
	<Header>
		<PrevButton />
		<Heading class="flex items-center justify-between font-normal">
			<Select.Root
				selected={defaultMonth}
				items={monthOptions}
				onSelectedChange={(v) => {
					if (!v || !placeholder) return;
					if (v.value === placeholder?.month) return;
					placeholder = placeholder.set({ month: v.value });
				}}
			>
				<SelectPrimitive.Trigger
					aria-label="Select month"
					class="text-sm px-2 py-1 rounded-tl rounded-bl transition-colors duration-200 hover:bg-base-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-content-muted"
				>
					<Select.Value placeholder="Select month" />
				</SelectPrimitive.Trigger>
				<Select.Content class="max-h-[200px] overflow-y-auto !w-[118px] pretty-scrollbar">
					{#each monthOptions as { value, label }}
						<Select.Item {value} {label}>
							{label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				selected={defaultYear}
				items={yearOptions}
				onSelectedChange={(v) => {
					if (!v || !placeholder || v.value === placeholder?.year) return;
					
					const newYear = v.value;
					const currentMonth = placeholder.month;
					
					// First, try to keep the same month in the new year
					const sameMonthDate = placeholder.set({ year: newYear, month: currentMonth });
					if ((!minValue || sameMonthDate.compare(minValue) >= 0) && 
						(!maxValue || sameMonthDate.compare(maxValue) <= 0)) {
						placeholder = sameMonthDate;
						return;
					}
					
					// If the same month is not available, find the closest valid month
					const isBeyondRange = maxValue && sameMonthDate.compare(maxValue) > 0;
					const startMonth = isBeyondRange ? 12 : 1;
					const endMonth = isBeyondRange ? 0 : 13;
					const step = isBeyondRange ? -1 : 1;
					
					for (let month = startMonth; month !== endMonth; month += step) {
						const testDate = placeholder.set({ year: newYear, month });
						if ((!minValue || testDate.compare(minValue) >= 0) && 
							(!maxValue || testDate.compare(maxValue) <= 0)) {
							placeholder = testDate;
							break;
						}
					}
				}}
			>
				<SelectPrimitive.Trigger
					aria-label="Select year"
					class="px-2 py-1 rounded-tr rounded-br text-sm hover:bg-base-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-content-muted"
				>
					<Select.Value placeholder="Select year" />
				</SelectPrimitive.Trigger>
				<Select.Content class="max-h-[200px] overflow-y-auto !w-[79px]">
					{#each yearOptions as { value, label }}
						<Select.Item {value} {label}>
							{label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</Heading>
		<NextButton />
	</Header>
	<Months>
		{#each months as month}
			<Grid>
				<GridHead>
					<GridRow class="flex">
						{#each weekdays as weekday}
							<HeadCell>
								{weekday.slice(0, 2)}
							</HeadCell>
						{/each}
					</GridRow>
				</GridHead>
				<GridBody>
					{#each month.weeks as weekDates}
						<GridRow class="mt-2 w-full">
							{#each weekDates as date}
								<Cell {date}>
									<Day {date} month={month.value} />
								</Cell>
							{/each}
						</GridRow>
					{/each}
				</GridBody>
			</Grid>
		{/each}
	</Months>
</CalendarPrimitive.Root>
