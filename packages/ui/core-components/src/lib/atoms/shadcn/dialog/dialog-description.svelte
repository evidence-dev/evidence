<script>
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<DialogPrimitive.Description
	class={cn('text-sm text-base-content-muted', className)}
	{...$$restProps}
>
	<slot />
</DialogPrimitive.Description>
