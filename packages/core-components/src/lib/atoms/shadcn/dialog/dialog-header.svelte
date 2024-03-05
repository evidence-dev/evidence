<script>
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<div class={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...$$restProps}>
	<slot />
</div>
