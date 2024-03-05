<script>
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<RangeCalendarPrimitive.GridRow class={cn('flex', className)} {...$$restProps}>
	<slot />
</RangeCalendarPrimitive.GridRow>
