<script>
	import { Command as CommandPrimitive } from 'cmdk-sv';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<CommandPrimitive.Empty class={cn('py-6 text-center text-sm', className)} {...$$restProps}>
	<slot />
</CommandPrimitive.Empty>
