<script>
	import ContentsList from './ContentsList.svelte';
	import { page, navigating } from '$app/stores';
</script>

<aside class="hidden lg:block w-48">
	{#if !$navigating && $page.data.isUserPage}
		<div class="fixed w-48 top-20 bottom-20 px-3 overflow-auto">
			<ContentsList />
		</div>
	{/if}
</aside>
