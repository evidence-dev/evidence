<script>
	import BreadCrumbs from './BreadCrumbs.svelte';
	import Hamburger from './Hamburger.svelte';
	import PageMenu from './PageMenu.svelte';
	import QueryToggleButton from './QueryToggleButton.svelte';
	export let fileTree;
	import { page } from '$app/stores';
	export let open = false;
</script>

<header>
	<div class="header-container">
		<Hamburger bind:open />
		<BreadCrumbs {fileTree} />
		{#if !$page.url.pathname.includes('/settings')}
			<div class="option-tray">
				<QueryToggleButton />
				<PageMenu />
			</div>
		{/if}
	</div>
</header>

<style>
	header {
		grid-area: header;
		height: var(--header-height);
		width: 100%;
	}

	.option-tray {
		display: flex;
		justify-content: flex-end;
		align-items: center;
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
