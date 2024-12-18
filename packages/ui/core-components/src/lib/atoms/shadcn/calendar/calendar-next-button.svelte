<script>
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronRight } from '@steeze-ui/radix-icons';
	import { buttonVariants } from '$lib/atoms/shadcn/button';
	import { cn } from '$lib/utils';

	let className = undefined;
	export { className as class };
</script>

<CalendarPrimitive.NextButton
	on:click
	class={cn(
		buttonVariants({ variant: 'ghost' }),
		'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
		className
	)}
	{...$$restProps}
	let:builder
>
	<slot {builder}>
		<Icon src={ChevronRight} class="h-4 w-4" />
	</slot>
</CalendarPrimitive.NextButton>
