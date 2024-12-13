<script>
	import { Command as CommandPrimitive } from 'cmdk-sv';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { MagnifyingGlass } from '@steeze-ui/radix-icons';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	/** @type {string} */
	export let value = '';

	export { className as class };
</script>

<div class="flex items-center border-b border-base-300 px-3" data-cmdk-input-wrapper="">
	<Icon src={MagnifyingGlass} class="mr-2 h-4 w-4 shrink-0 text-base-content-muted" />
	<CommandPrimitive.Input
		class={cn(
			'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-base-content-muted disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		{...$$restProps}
		bind:value
	/>
</div>
