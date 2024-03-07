<script>
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<div
	class={cn('flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 mt-4', className)}
	{...$$restProps}
>
	<slot />
</div>
