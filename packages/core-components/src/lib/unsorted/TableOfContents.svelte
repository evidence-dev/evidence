<script>
	import ContentsList from './ContentsList.svelte';
	import { navigating, page } from '$app/stores';
</script>

<aside class="hidden lg:block w-48">
	{#if !$navigating}
		<div class="fixed w-48 top-20 bottom-20 px-3 overflow-auto ">
			<ContentsList />
		</div>
	{/if}
</aside>

<!-- <div class="hidden: md:block  overflow-y-auto flex-1 text-sm text-gray-500"> -->
<!-- <div class="flex flex-col pb-6"> -->
