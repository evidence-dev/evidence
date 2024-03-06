<script>
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<div
	class={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
	{...$$restProps}
>
	<slot />
</div>
