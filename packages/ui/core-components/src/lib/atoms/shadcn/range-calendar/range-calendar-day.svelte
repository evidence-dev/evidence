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
		'[&[data-today]:not([data-selected])]:border [&[data-today]:not([data-selected])]:border-dashed [&[data-today]:not([data-selected])]:border-base-300 [&[data-today]:not([data-selected])]:text-base-content',
		// Selection Start
		'data-[selection-start]:bg-base-content data-[selection-start]:text-base-100 data-[selection-start]:hover:bg-base-content data-[selection-start]:hover:text-base-100 data-[selection-start]:focus:bg-base-content data-[selection-start]:focus:text-base-100',
		// Selection End
		'data-[selection-end]:bg-base-content data-[selection-end]:text-base-100 data-[selection-end]:hover:bg-base-content data-[selection-end]:hover:text-base-100 data-[selection-end]:focus:bg-base-content data-[selection-end]:focus:text-base-100',
		// Outside months
		'data-[outside-month]:pointer-events-none data-[outside-month]:text-base-content-muted data-[outside-month]:opacity-50 [&[data-outside-month][data-selected]]:bg-base-200/50 [&[data-outside-month][data-selected]]:text-base-content-muted [&[data-outside-month][data-selected]]:opacity-30',
		// Disabled
		'data-[disabled]:text-base-content-muted data-[disabled]:opacity-50',
		// Unavailable
		'data-[unavailable]:text-negative/20 data-[unavailable]:line-through',
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
