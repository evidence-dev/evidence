<script>
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<RangeCalendarPrimitive.Heading
	let:headingValue
	class={cn('text-sm font-medium', className)}
	{...$$restProps}
>
	<slot {headingValue}>
		{headingValue}
	</slot>
</RangeCalendarPrimitive.Heading>
