<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import BreadCrumbs from './BreadCrumbs.svelte';
	import Hamburger from './Hamburger.svelte';
	import PageMenu from './PageMenu.svelte';
	export let fileTree;
	import { page } from '$app/stores';
	export let open = false;
</script>

<header>
	<div class="header-container">
		<Hamburger bind:open />
		<BreadCrumbs {fileTree} />
		{#if $page.data.isUserPage}
			<PageMenu />
		{/if}
	</div>
</header>

<style>
	header {
		grid-area: header;
		height: var(--header-height);
		width: 100%;
	}

	div.header-container {
		height: var(--header-height);
		box-sizing: border-box;
		display: flex;
		justify-items: right;
		align-items: center;
	}

	@media print {
		header {
			display: none;
		}
	}
</style>
