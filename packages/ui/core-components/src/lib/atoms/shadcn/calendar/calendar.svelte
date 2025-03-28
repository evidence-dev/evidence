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
	import { DateFormatter } from '@internationalized/date';

	import { dateValueToDate } from '../../inputs/date-input/helpers.js';
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

	$: yearOptions = Array.from({ length: 100 }, (_, i) => ({
		label: String(new Date().getFullYear() - i),
		value: new Date().getFullYear() - i
	})).filter(({ value }) => !(minValue?.year > value || value > maxValue?.year));

	$: defaultYear = placeholder
		? { value: placeholder.year, label: String(placeholder.year) }
		: undefined;

	$: defaultMonth = placeholder
		? { value: placeholder.month, label: monthFmt.format(dateValueToDate(placeholder)) }
		: undefined;

	export {
		className as class,
		value,
		placeholder,
		weekdayFormat,
		startValue,
		selectedDateInput,
		minValue,
		maxValue
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
					if (!v || !placeholder) return;
					if (v.value === placeholder?.year) return;
					placeholder = placeholder.set({ year: v.value });
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
