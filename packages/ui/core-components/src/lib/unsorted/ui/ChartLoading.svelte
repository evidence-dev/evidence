<script>
	import { fade } from 'svelte/transition';

	export let height = '231px';
</script>

<div role="status" class="animate-pulse" in:fade|local>
	<span class="sr-only">Loading...</span>
	<div
		class="bg-base-100 rounded-md max-w-[100%]"
		style="height:{height}; margin-top: 15px; margin-bottom: 31px;"
	/>
</div>
