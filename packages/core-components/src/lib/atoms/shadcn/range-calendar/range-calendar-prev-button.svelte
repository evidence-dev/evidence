<script>
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { ChevronLeft } from 'radix-icons-svelte';
	import { buttonVariants } from '$lib/atoms/shadcn/button';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<RangeCalendarPrimitive.PrevButton
	on:click
	class={cn(
		buttonVariants({ variant: 'outline' }),
		'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
		className
	)}
	{...$$restProps}
	let:builder
>
	<slot {builder}>
		<ChevronLeft class="h-4 w-4" />
	</slot>
</RangeCalendarPrimitive.PrevButton>
