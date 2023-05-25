<script>
	import { fade } from 'svelte/transition';

	let waitingLong = false;

	setTimeout(() => {
		waitingLong = true;
	}, 250);
</script>

{#if waitingLong}
	<div role="status" class="animate-pulse" in:fade|local >
		<span class="sr-only">Loading...</span>
		<div class="h-8 bg-gray-50 rounded-full dark:bg-gray-400 w-48 mb-8" />
		<div class="flex gap-3">
			<div class="h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3" />
			<div class="h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3" />
			<div class="h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3" />
			<div class="h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3" />
		</div>
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[70%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[65%] mb-3" />
		<div class="h-56 bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[80%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[90%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[70%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[80%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[100%] mb-3" />
		<div class="h-56 bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[70%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[75%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[90%] mb-3" />
		<div class="h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[80%] mb-3" />
		<div class="h-56 bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%] mb-3" />
	</div>
{/if}
