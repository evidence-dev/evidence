<script>
	import { Switch } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let className = undefined;
	export let checked = undefined;
	export { className as class };
</script>

<Switch.Root
	bind:checked
	class={cn(
		'focus-visible:ring-base-300 focus-visible:ring-offset-base-100 data-[state=checked]:bg-base-content data-[state=unchecked]:bg-base-300 peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...$$restProps}
	on:click
	on:keydown
>
	<Switch.Thumb
		class={cn(
			'bg-base-100 pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
		)}
	/>
</Switch.Root>
