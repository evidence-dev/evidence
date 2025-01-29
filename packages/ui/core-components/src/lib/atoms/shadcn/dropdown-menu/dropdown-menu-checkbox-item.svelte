<script>
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Check } from '@steeze-ui/radix-icons';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {boolean | undefined} */
	export let checked = undefined;

	export { className as class };
</script>

<DropdownMenuPrimitive.CheckboxItem
	bind:checked
	class={cn(
		'relative flex cursor-default select-none items-center rounded-xs py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-base-200 data-[highlighted]:text-base-content-muted data-[disabled]:opacity-50',
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
	on:focusin
	on:focusout
	on:pointerdown
	on:pointerleave
	on:pointermove
>
	<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
		<DropdownMenuPrimitive.CheckboxIndicator>
			<Icon src={Check} class="h-4 w-4" />
		</DropdownMenuPrimitive.CheckboxIndicator>
	</span>
	<slot />
</DropdownMenuPrimitive.CheckboxItem>
