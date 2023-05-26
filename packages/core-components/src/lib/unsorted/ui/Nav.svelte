<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { page } from '$app/stores';
	export let sections = [{ href: '/', label: 'Home' }];
	$: currentSection = '/' + $page.url.pathname.split('/')[1];
</script>

<div class="nav-container">
	{#each sections as section}
		<a aria-current={currentSection === section.href ? 'page' : undefined} href={section.href}
			>{section.label}</a
		>
	{/each}
</div>

<style>
	div.nav-container {
		overflow: auto;
		white-space: nowrap;
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	div.nav-container a {
		color: var(--grey-999);
		display: inline-block;
		text-align: center;
		text-decoration: none;
		font-family: var(--ui-font-family-compact);
		padding: 0 1em 0 0;
		letter-spacing: 0.05em;
		-webkit-font-smoothing: antialiased;
	}
	::-webkit-scrollbar {
		display: none;
	}

	a:hover {
		text-decoration: none;
		background-color: none;
		text-decoration: none;
	}

	[aria-current] {
		position: relative;
		display: inline-block;
	}

	[aria-current]::after {
		position: absolute;
		content: '';
		width: calc(100% - 1em);
		height: 2px;
		background: -webkit-linear-gradient(315deg, var(--blue-600) 0%, var(--green-600) 75%);
		display: block;
		bottom: -2px;
	}
</style>
