<script>
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {boolean} */
	export let well;

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<TabsPrimitive.List
	class={cn(
		' overflow-x-auto overflow-y-hidden flex pretty-scrollbar',
		well
			? ' w-fit max-w-full h-9 items-center rounded-lg bg-gray-100 p-1 text-gray-500 '
			: ' border-b border-gray-200',
		className
	)}
	{...$$restProps}
>
	<slot />
</TabsPrimitive.List>
