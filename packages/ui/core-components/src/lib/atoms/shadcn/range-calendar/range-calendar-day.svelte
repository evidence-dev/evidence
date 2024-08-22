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
		'data-[selection-start]:bg-primary data-[selection-start]:text-primary-foreground data-[selection-start]:hover:bg-primary data-[selection-start]:hover:text-primary-foreground data-[selection-start]:focus:bg-primary data-[selection-start]:focus:text-primary-foreground',
		// Selection End
		'data-[selection-end]:bg-primary data-[selection-end]:text-primary-foreground data-[selection-end]:hover:bg-primary data-[selection-end]:hover:text-primary-foreground data-[selection-end]:focus:bg-primary data-[selection-end]:focus:text-primary-foreground',
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
