<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';

	export let height = '231px';
</script>

<div role="status" class="animate-pulse" in:fade|local>
	<span class="sr-only">Loading...</span>
	<div
		class="bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%]"
		style="height:{height}; margin-top: 15px; margin-bottom: 29px;"
	/>
</div>