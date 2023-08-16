<script>
	import ContentsList from './ContentsList.svelte';
	import { navigating } from '$app/stores';
</script>

<aside class="hidden lg:block w-48">
	{#if !$navigating}
		<div class="fixed w-48 top-20 bottom-20 px-3 overflow-auto pretty-scrollbar">
			<ContentsList />
		</div>
	{/if}
</aside>
