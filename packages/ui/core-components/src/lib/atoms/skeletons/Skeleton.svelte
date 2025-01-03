<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';

	export let mt = 2;
</script>

<div class="animate-pulse h-full w-full mt-{mt} mb-4" in:fade|local>
	<span class="sr-only">Loading...</span>
	<div class="h-full w-full rounded-md bg-base-300" />
</div>
