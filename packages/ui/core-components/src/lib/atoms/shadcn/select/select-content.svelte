<script>
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn, flyAndScale } from '$lib/utils';
	import { scale } from 'svelte/transition';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {number} */
	export let sideOffset = 4;
	/** @type {function} */
	export let inTransition = flyAndScale;
	/** @type {object | undefined} */
	export let inTransitionConfig = undefined;
	/** @type {function} */
	export let outTransition = scale;
	/** @type {object} */
	export let outTransitionConfig = {
		start: 0.95,
		opacity: 0,
		duration: 50
	};
	export { className as class };
</script>

<SelectPrimitive.Content
	{inTransition}
	{inTransitionConfig}
	{outTransition}
	{outTransitionConfig}
	{sideOffset}
	class={cn(
		'relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-base-300 bg-base-100 shadow-md focus:outline-none',
		className
	)}
	{...$$restProps}
>
	<div class="w-full p-1">
		<slot />
	</div>
</SelectPrimitive.Content>
