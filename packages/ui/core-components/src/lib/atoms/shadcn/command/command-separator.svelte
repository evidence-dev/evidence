<script>
	import { Command as CommandPrimitive } from 'cmdk-sv';
	import { cn } from '$lib/utils';

	/** @type {string | undefined | null} */
	let className = undefined;

	export { className as class };
</script>

<CommandPrimitive.Separator class={cn('-mx-1 h-px bg-base-300', className)} {...$$restProps} />
