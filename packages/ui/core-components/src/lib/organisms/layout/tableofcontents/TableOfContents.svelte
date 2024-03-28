<script>
	import ContentsList from './ContentsList.svelte';
	import { page, navigating } from '$app/stores';

	export let hideHeader = false;
</script>

<aside class="hidden lg:block w-48">
	{#if !$navigating && $page.data.isUserPage}
		<div
			class="fixed w-48 top-20 bottom-20 pl-4 px-3 overflow-auto pretty-scrollbar"
			class:top-8={hideHeader}
		>
			<ContentsList />
		</div>
	{/if}
</aside>
