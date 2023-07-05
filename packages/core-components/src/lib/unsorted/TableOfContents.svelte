<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import ContentsList from './ContentsList.svelte';
	import { navigating, page } from '$app/stores';
</script>

<div class="container">
	{#if !$navigating && $page.data.isUserPage}
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
