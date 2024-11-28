<script>
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let className = undefined;
	export { className as class };
</script>

<CalendarPrimitive.Grid class={cn('w-full border-collapse space-y-1', className)} {...$$restProps}>
	<slot />
</CalendarPrimitive.Grid>
