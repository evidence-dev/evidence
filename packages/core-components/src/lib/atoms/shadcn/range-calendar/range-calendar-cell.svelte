<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	type $$Props = RangeCalendarPrimitive.CellProps;

	export let date: $$Props['date'];
	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<RangeCalendarPrimitive.Cell
	{date}
	class={cn(
		'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:bg-gray-100 first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md [&:has([data-selected][data-outside-month])]:bg-gray-100/50 [&:has([data-selected][data-selection-end])]:rounded-r-md',
		className
	)}
	{...$$restProps}
>
	<slot />
</RangeCalendarPrimitive.Cell>
