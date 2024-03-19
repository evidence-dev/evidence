<script>
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {boolean | undefined} */
	export let inset = undefined;

	export { className as class };
</script>

<DropdownMenuPrimitive.Label
	class={cn('px-2 py-1.5 text-sm font-semibold bg-white', inset && 'pl-8', className)}
	{...$$restProps}
>
	<slot />
</DropdownMenuPrimitive.Label>
