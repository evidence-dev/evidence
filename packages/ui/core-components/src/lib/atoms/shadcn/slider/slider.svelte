<script>
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	/** @type {SliderPrimitive.Props["class"]} */
	let className = undefined;

	/** @type {SliderPrimitive.Props["value"]} */
	export let value = [0];
	export { className as class };
</script>

<SliderPrimitive.Root
	bind:value
	class={cn('relative flex w-full touch-none select-none items-center', className)}
	{...$$restProps}
	let:thumbs
>
	<span class="relative h-1 w-full grow rounded-full bg-gray-900/20">
		<SliderPrimitive.Range class="absolute h-full bg-gray-900" />
	</span>
	{#each thumbs as thumb}
		<SliderPrimitive.Thumb
			{thumb}
			class="block h-3 w-3 rounded-full border-2 border-gray-900/50 bg-gray-900 shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring  disabled:opacity-50 cursor-pointer"
		/>
	{/each}
</SliderPrimitive.Root>
