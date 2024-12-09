<script>
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CaretSort } from '@steeze-ui/radix-icons';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<SelectPrimitive.Trigger
	class={cn(
		'border border-base-300 flex h-9 w-full items-center justify-between rounded-md bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-base-content-muted focus:outline-none focus:ring-1 focus:ring-base-content-muted disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...$$restProps}
>
	<slot />
	<div>
		<Icon src={CaretSort} class="h-4 w-4" />
	</div>
</SelectPrimitive.Trigger>
