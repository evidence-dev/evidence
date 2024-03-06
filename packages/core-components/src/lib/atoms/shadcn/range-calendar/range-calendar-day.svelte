<script>
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { buttonVariants } from '$lib/atoms/shadcn/button';
	import { cn } from '$lib/utils';

	/** @type {any} */
	export let date = undefined;

	/** @type {any} */
	export let month = undefined;

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<RangeCalendarPrimitive.Day
	on:click
	{date}
	{month}
	class={cn(
		buttonVariants({ variant: 'ghost' }),
		'h-8 w-8 p-0 font-normal data-[selected]:opacity-100',
		// Today
		'[&[data-today]:not([data-selected])]:border [&[data-today]:not([data-selected])]:border-dashed  [&[data-today]:not([data-selected])]:text-gray-900',
		// Selection Start
		'data-[selection-start]:bg-gray-900 data-[selection-start]:text-white data-[selection-start]:hover:bg-gray-900 data-[selection-start]:hover:text-white data-[selection-start]:focus:bg-gray-900 data-[selection-start]:focus:text-white',
		// Selection End
		'data-[selection-end]:bg-gray-900 data-[selection-end]:text-white data-[selection-end]:hover:bg-gray-900 data-[selection-end]:hover:text-white data-[selection-end]:focus:bg-gray-900 data-[selection-end]:focus:text-white',
		// Outside months
		'data-[outside-month]:pointer-events-none data-[outside-month]:text-gray-500 data-[outside-month]:opacity-50 [&[data-outside-month][data-selected]]:bg-gray-100/50 [&[data-outside-month][data-selected]]:text-gray-500 [&[data-outside-month][data-selected]]:opacity-30',
		// Disabled
		'data-[disabled]:text-gray-500 data-[disabled]:opacity-50',
		// Unavailable
		'data-[unavailable]:text-red-50 data-[unavailable]:line-through',
		className
	)}
	{...$$restProps}
	let:disabled
	let:unavailable
	let:builder
>
	<slot {disabled} {unavailable} {builder}>
		{date.day}
	</slot>
</RangeCalendarPrimitive.Day>
