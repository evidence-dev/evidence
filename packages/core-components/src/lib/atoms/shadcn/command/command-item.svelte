<script>
	import { Command as CommandPrimitive } from 'cmdk-sv';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<CommandPrimitive.Item
	class={cn(
		'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		className
	)}
	{...$$restProps}
>
	<slot />
</CommandPrimitive.Item>
