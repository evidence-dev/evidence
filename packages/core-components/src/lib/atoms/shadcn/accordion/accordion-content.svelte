<script>
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<AccordionPrimitive.Content class={cn('overflow-hidden text-sm', className)} {...$$restProps}>
	<div class="pb-4 pt-0" transition:slide|local={{ duration: 200 }}>
		<slot />
	</div>
</AccordionPrimitive.Content>
