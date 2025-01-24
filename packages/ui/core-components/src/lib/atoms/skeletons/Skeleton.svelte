<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils.js';

	let className = undefined;
	export { className as class };
</script>

<div class={cn('animate-pulse h-full w-full mt-2 mb-4', className)} in:fade|local>
	<span class="sr-only">Loading...</span>
	<div class="h-full w-full rounded-md bg-base-300" />
</div>
