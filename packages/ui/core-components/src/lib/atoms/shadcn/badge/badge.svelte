<script>
	import { cn } from '$lib/utils';
	import { badgeVariants } from '.';

	/** @type {string | undefined | null} */
	let className = undefined;

	/** @type {string | undefined} */
	export let href = undefined;

	/** @type {import('./index.js').Variant} */
	export let variant = 'default';

	export { className as class };
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	{href}
	class={cn(badgeVariants({ variant, className }))}
	{...$$restProps}
>
	<slot />
</svelte:element>
