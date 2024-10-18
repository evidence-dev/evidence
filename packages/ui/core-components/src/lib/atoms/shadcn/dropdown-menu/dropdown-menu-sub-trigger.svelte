<script>
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronRight } from '@steeze-ui/radix-icons';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {boolean | undefined} */
	export let inset = undefined;

	export { className as class };
</script>

<DropdownMenuPrimitive.SubTrigger
	class={cn(
		'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-base-200 data-[state=open]:bg-accent data-[highlighted]:text-base-content data-[state=open]:text-accent-foreground',
		inset && 'pl-8',
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
	on:focusin
	on:focusout
	on:pointerleave
	on:pointermove
>
	<slot />
	<Icon src={ChevronRight} class="ml-auto h-4 w-4" />
</DropdownMenuPrimitive.SubTrigger>
