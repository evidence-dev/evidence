<script>
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '../../../utils.js';

	/** @type {SliderPrimitive.Props["class"]} */
	let className = undefined;

	/** @type {SliderPrimitive.Props["value"]} */
	export let value = [0];
	export { className as class };
</script>

<SliderPrimitive.Root
	bind:value
	class={cn('relative left-1.5 flex w-full touch-none select-none items-center', className)}
	{...$$restProps}
	let:thumbs
>
	<span
		class="relative h-1 w-full grow rounded-l-full bg-base-300 cursor-pointer before:block before:absolute before:-top-4 before:-left-1.5 before:h-9 before:transparent before:z-0 before:w-[calc(100%+0.6rem)]"
	>
		<SliderPrimitive.Range
			class={`absolute h-full bg-base-content before:block before:absolute before:top-0 before:-left-1.5 before:w-2 before:h-1 before:bg-base-content after:block after:absolute after:top-0 after:-right-1 after:w-1 after:h-1 after:bg-base-content/20 after:-z-10 after:rounded-r-full`}
		/>
	</span>
	{#each thumbs ?? [] as thumb}
		<SliderPrimitive.Thumb
			{thumb}
			class="block h-3 w-3 rounded-full border border-base-content bg-base-content shadow transition-colors active:outline-none ring-primary/50 active:ring-2 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 cursor-pointer"
		/>
	{:else}
		<SliderPrimitive.Thumb
			class="block h-3 w-3 rounded-full border border-base-content bg-base-content shadow transition-colors active:outline-none ring-primary/50 active:ring-2 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 cursor-pointer"
		/>
	{/each}
</SliderPrimitive.Root>
