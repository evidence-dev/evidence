<script>
	import { LinkPreview as HoverCardPrimitive } from 'bits-ui';
	import { cn, flyAndScale } from '$lib/utils.js';

	/** @type {string | undefined | null} */
	let className = undefined;
	/** @type {any} */
	export let transition = flyAndScale;
	/** @type {Object | undefined} */
	export let transitionConfig = undefined;
	/** @type {string} */
	export let align = 'center';
	/** @type {number} */
	export let sideOffset = 4;

	export { className as class };
</script>

<HoverCardPrimitive.Content
	{transition}
	{transitionConfig}
	{align}
	{sideOffset}
	class={cn('z-50 my-2 rounded-md border bg-base-100 shadow-md outline-none', className)}
	{...$$restProps}
>
	<slot />
</HoverCardPrimitive.Content>
