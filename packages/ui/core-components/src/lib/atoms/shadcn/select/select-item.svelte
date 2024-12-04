<script>
	import { cn } from '$lib/utils';
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Check } from '@steeze-ui/radix-icons';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {any} */
	export let value;
	/** @type {string | undefined | null} */
	export let label = undefined;
	/** @type {boolean | undefined} */
	export let disabled = undefined;

	export { className as class };
</script>

<SelectPrimitive.Item
	{value}
	{disabled}
	{label}
	class={cn(
		'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-base-200  data-[disabled]:opacity-50',
		className
	)}
	{...$$restProps}
	on:click
	on:pointermove
	on:focusin
>
	<span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
		<SelectPrimitive.ItemIndicator>
			<Icon src={Check} class="h-4 w-4" />
		</SelectPrimitive.ItemIndicator>
	</span>
	<slot />
</SelectPrimitive.Item>
