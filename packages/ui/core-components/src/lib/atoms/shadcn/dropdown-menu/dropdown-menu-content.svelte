<script>
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn, flyAndScale } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {number} */
	export let sideOffset = 4;
	/** @type {any} */
	export let transition = flyAndScale;
	/** @type {Object | undefined} */
	export let transitionConfig = undefined;

	export { className as class };
</script>

<DropdownMenuPrimitive.Content
	{transition}
	{transitionConfig}
	{sideOffset}
	class={cn(
		'z-50 min-w-[8rem] rounded-md border border-base-300 bg-popover p-1 shadow-md bg-base-100 focus:outline-none antialiased text-base-conetnt print:hidden',
		className
	)}
	{...$$restProps}
	on:keydown
>
	<slot />
</DropdownMenuPrimitive.Content>
