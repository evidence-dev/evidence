<script>
	import ContentsList from './ContentsList.svelte';
	import { navigating, page } from '$app/stores';
	import { base } from '$app/paths';
</script>

<div class="container">
	{#if !$navigating && $page.url.pathname !== `${base}/settings`}
		<ContentsList />
	{/if}
</div>

<style>
	div.container {
		position: sticky;
		top: var(--header-height);
		height: 70vh;
		overflow-y: auto;
	}
</style>
