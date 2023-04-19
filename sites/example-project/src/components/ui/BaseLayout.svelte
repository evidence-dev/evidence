<script>
	import '../global.css';
	import { navigating } from '$app/stores';
	import { blur } from 'svelte/transition';
	import { Nav, BreadCrumbs, LoadingIndicator, Logo } from '@evidence-dev/components';
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Evidence</title>
</svelte:head>

{#if $navigating}
	<LoadingIndicator />
{/if}

<div class="header">
	<Logo organization="Cozzini Brothers" />
	<Nav
		sections={[
			{ href: `${base}/`, label: 'Home' },
			{ href: `${base}/examples`, label: 'Examples' },
			{ href: `${base}/FAQ`, label: 'FAQ' },
			{ href: `${base}/blog`, label: 'Blog' }
		]}
	/>
</div>

{#if !$navigating}
	<main in:blur|local>
		<BreadCrumbs />
		<article>
			<slot />
		</article>
	</main>
{/if}

<style>
	div.header {
		padding: 0.5em 1.5em 0 1.5em;
	}
</style>
