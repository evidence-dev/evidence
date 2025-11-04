<script>
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {boolean | undefined} */
	export let inset = undefined;

	export { className as class };
</script>

<DropdownMenuPrimitive.Item
	class={cn(
		'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-base-200  data-[disabled]:opacity-50',
		inset && 'pl-8',
		className
	)}
	on:click
	on:keydown
	on:focusin
	on:focusout
	on:pointerdown
	on:pointerleave
	on:pointermove
	{...$$restProps}
>
	<slot />
</DropdownMenuPrimitive.Item>
