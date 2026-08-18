<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '../../../../shadcn/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: RangeCalendarPrimitive.GridHeadProps = $props();
</script>

<RangeCalendarPrimitive.GridHead bind:ref class={cn(className)} {...restProps} />
