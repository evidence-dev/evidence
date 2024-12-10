<script>
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronLeft } from '@steeze-ui/radix-icons';
	import { buttonVariants } from '$lib/atoms/shadcn/button';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<CalendarPrimitive.PrevButton
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
		<Icon src={ChevronLeft} class="h-4 w-4" />
	</slot>
</CalendarPrimitive.PrevButton>
