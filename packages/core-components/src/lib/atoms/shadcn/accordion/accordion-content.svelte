<script>
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {any} */
	export let transition = slide;
	/** @type {Object} */
	export let transitionConfig = {
		duration: 200
	};

	export { className as class };
</script>

<AccordionPrimitive.Content
	class={cn('overflow-hidden text-sm', className)}
	{transition}
	{transitionConfig}
	{...$$restProps}
>
	<div class="pb-4 pt-0">
		<slot />
	</div>
</AccordionPrimitive.Content>
