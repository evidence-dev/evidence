<script>
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<RangeCalendarPrimitive.GridHead class={cn(className)} {...$$restProps}>
	<slot />
</RangeCalendarPrimitive.GridHead>
