<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { cn } from '$lib/utils.js';

	let className = undefined;
	export { className as class };
</script>

<div class={cn('block text-xs text-gray-500 leading-none mt-0 pb-3', className)}>
	<slot />
</div>
