<script>
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<RangeCalendarPrimitive.Header
	class={cn('flex justify-between pt-1 relative items-center w-full', className)}
	{...$$restProps}
>
	<slot />
</RangeCalendarPrimitive.Header>
