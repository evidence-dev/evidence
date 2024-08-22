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
		'[&[data-today]:not([data-selected])]:border [&[data-today]:not([data-selected])]:border-dashed [&[data-today]:not([data-selected])]:text-foreground',
		// Selection Start
		'data-[selection-start]:bg-black data-[selection-start]:text-white data-[selection-start]:hover:bg-black data-[selection-start]:hover:text-white data-[selection-start]:focus:bg-black data-[selection-start]:focus:text-white dark:data-[selection-start]:bg-white dark:data-[selection-start]:text-black dark:data-[selection-start]:hover:bg-white dark:data-[selection-start]:hover:text-black dark:data-[selection-start]:focus:bg-white dark:data-[selection-start]:focus:text-black',
		// Selection End
		'data-[selection-end]:bg-black data-[selection-end]:text-white data-[selection-end]:hover:bg-black data-[selection-end]:hover:text-white data-[selection-end]:focus:bg-black data-[selection-end]:focus:text-white dark:data-[selection-end]:bg-white dark:data-[selection-end]:text-black dark:data-[selection-end]:hover:bg-white dark:data-[selection-end]:hover:text-black dark:data-[selection-end]:focus:bg-white dark:data-[selection-end]:focus:text-black',
		// Outside months
		'data-[outside-month]:pointer-events-none data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-50 [&[data-outside-month][data-selected]]:bg-muted/50 [&[data-outside-month][data-selected]]:text-muted-foreground [&[data-outside-month][data-selected]]:opacity-30',
		// Disabled
		'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
		// Unavailable
		'data-[unavailable]:text-destructive data-[unavailable]:line-through',
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
