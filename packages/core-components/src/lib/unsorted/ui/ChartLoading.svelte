<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';
</script>

<div role="status" class="animate-pulse" in:fade|local>
	<span class="sr-only">Loading...</span>
	<div class="h-48 bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%] mt-5 mb-12" />
</div>