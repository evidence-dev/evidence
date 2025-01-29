<script>
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronDown } from '@steeze-ui/radix-icons';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {number} */
	export let level = 3;

	export { className as class };
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		class={cn(
			'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 rounded-sm focus-visible:ring-base-200 focus-visible:outline-none focus-visible:ring-2',
			className
		)}
		{...$$restProps}
		on:click
	>
		<slot />
		<Icon
			src={ChevronDown}
			class="h-4 w-4 shrink-0 text-base-300 transition-transform duration-200"
		/>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
