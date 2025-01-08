<script>
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { buttonVariants } from '$lib/atoms/shadcn/button';
	import { cn } from '$lib/utils.js';

	export let date;
	export let month;
	let className = undefined;
	export { className as class };
</script>

<CalendarPrimitive.Day
	on:click
	{date}
	{month}
	class={cn(
		buttonVariants({ variant: 'ghost' }),
		'h-9 w-9 p-0 font-normal ',
		// Today
		'[&[data-today]:not([data-selected])]:border [&[data-today]:not([data-selected])]:border-dashed  [&[data-today]:not([data-selected])]:text-gray-900',
		// Selected
		'data-[selected]:bg-gray-900 data-[selected]:text-white data-[selected]:hover:bg-gray-900 data-[selected]:hover:text-white data-[selected]:focus:bg-gray-900 data-[selected]:focus:text-white',
		// Disabled
		'data-[disabled]:text-gray-500 data-[disabled]:opacity-50',
		// Unavailable
		'data-[unavailable]:text-red-50 data-[unavailable]:line-through',
		// Outside months
		'data-[outside-month]:pointer-events-none data-[outside-month]:text-gray-500 data-[outside-month]:opacity-50 [&[data-outside-month][data-selected]]:bg-gray-100/50 [&[data-outside-month][data-selected]]:text-gray-500 [&[data-outside-month][data-selected]]:opacity-30',
		className
	)}
	{...$$restProps}
	let:selected
	let:disabled
	let:unavailable
	let:builder
>
	<slot {selected} {disabled} {unavailable} {builder}>
		{date.day}
	</slot>
</CalendarPrimitive.Day>
