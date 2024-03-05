<script>
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<span class={cn('ml-auto text-xs tracking-widest text-gray-500', className)} {...$$restProps}>
	<slot />
</span>
