<script>
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';

	/** @type {string | undefined | null} */
	let className = undefined;

	/** @type {any} */
	export let transition = fade;

	/** @type {Object} */
	export let transitionConfig = {
		duration: 150
	};

	export { className as class };
</script>

<DialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	class={cn('fixed inset-0 z-50 bg-white/80 backdrop-blur-sm ', className)}
	{...$$restProps}
/>
