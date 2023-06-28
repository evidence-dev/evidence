<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Settings, X } from '@steeze-ui/tabler-icons';

	import { page } from '$app/stores';
	import { dev } from '$app/environment';

	import CollapsibleSection from '../ui/CollapsibleSection.svelte';

	export let fileTree;
	export let open;

	// children of the index page
	let firstLevelFiles = fileTree?.children;
</script>

<aside class="sidebar" class:open>
	<div class="sticky">
		<div class="nav-header">
			<a href="/" on:click={() => (open = !open)}><h2 class="project-title">Evidence</h2></a>
			<button class="close" on:click={() => (open = !open)}>
				<Icon src={X} class="h-9 w-9" />
			</button>
		</div>
		<nav>
			{#each firstLevelFiles as file}
				{#if file.children.length > 0}
					<CollapsibleSection folder={file} bind:open />
				{:else if file.href}
					<a href={file.href} on:click={() => (open = !open)} style="">
						<div class:selected={'/' + $page.url.pathname.split('/')[1] === file.href}>
							{file.label}
						</div>
					</a>
				{/if}
			{/each}
			<div class="spacer" />
		</nav>
		{#if dev}
			<div class="nav-footer">
				<a
					href="/settings"
					class="settings-link"
					class:selected={$page.url.pathname === '/settings'}
				>
					<span class="settings-icon flex justify-center items-center">
						<Icon src={Settings} class="w-4 h-4 p-0" />
					</span>
					<a class="settings-label" href="/settings"> Settings </a>
				</a>
			</div>
		{/if}
	</div>
</aside>

<style>
	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical)*/
	}

	aside.sidebar {
		grid-area: sidebar;
		position: relative;
		z-index: 3;
		background-color: var(--grey-100);
		border-right: 1px solid var(--grey-300);
	}

	.project-title {
		font-size: 22px;
		margin: 0 0 0.3em 0;
		padding-top: 0.3em;
	}

	button.close {
		display: none;
	}

	.sticky {
		position: sticky;
		top: 0;
		padding: 0;
		height: 100vh;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 3rem 1fr 4rem;
		grid-template-areas:
			'header'
			'nav'
			'footer';
	}

	nav {
		overflow-y: scroll;
		overflow-x: hidden;
		grid-area: nav;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
	}

	nav::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}
	nav::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}
	nav::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}
	nav::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}
	nav::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	nav::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	a {
		text-transform: capitalize;
		color: var(--grey-700);
		display: inline-block;
		text-decoration: none;
		font-family: var(--ui-font-family);
		-webkit-font-smoothing: antialiased;
	}

	nav a {
		font-size: 15px;
		display: block;
		color: var(--grey-700);
	}

	nav div {
		padding: 0.2rem 1rem 0.2rem 1.2rem;
	}

	nav div:hover {
		color: var(--grey-900);
	}

	nav a:hover {
		text-decoration: none;
		background-color: none;
		text-decoration: none;
	}

	div.selected {
		color: var(--blue-600);
		font-weight: 500;
	}

	div.selected:hover {
		color: var(--blue-800);
	}

	div.nav-header {
		padding: 0.2rem 0.2rem 0 1.2rem;
		grid-area: header;
		display: flex;
		justify-content: space-between;
	}

	.nav-header {
		overflow: hidden;
	}

	div.nav-header a {
		display: block;
	}

	.nav-footer {
		padding: 1.2rem 1rem 1.2rem 1.2rem;
		box-sizing: border-box;
		position: absolute;
		bottom: 0;
		height: 100%;
		width: 100%;
		border-top: 1px solid var(--grey-200);
		grid-area: footer;
		display: flex;
		font-size: 16px;
	}
	.settings-link {
		display: grid;
		grid-template-columns: 2rem auto;
	}

	.settings-label {
		color: var(--grey-700);
	}

	.settings-link:hover .settings-icon {
		color: var(--grey-700);
	}

	.settings-link:hover a {
		color: var(--grey-900);
	}

	.settings-link.selected a {
		color: var(--blue-600);
	}

	.settings-link.selected .settings-icon {
		color: var(--blue-600);
	}

	.settings-link.selected:hover a {
		color: var(--blue-800);
	}

	.settings-link.selected:hover .settings-icon {
		color: var(--blue-800);
	}

	.settings-icon :global(svg) {
		color: var(--grey-500);
	}

	.nav-footer a {
		color: var(--grey-700);
	}

	.spacer {
		display: none;
		height: 100px;
		width: 100%;
	}

	@media (max-width: 850px) {
		aside.sidebar {
			grid-area: none;
			position: fixed;
			height: 100%;
			width: 80%;
			left: -100%;
			transition: left 0.3s ease-in-out;
			background-color: hsla(217, 33%, 97%, 0.83);
			-webkit-backdrop-filter: blur(20px) saturate(1.8);
			backdrop-filter: blur(20px) saturate(1.8);
			border-right: 1px solid var(--grey-300);
		}

		aside.open {
			left: 0;
		}

		div.nav-footer {
			display: none;
		}

		.spacer {
			display: block;
		}

		button.close {
			display: inline;
			background-color: transparent;
			border: none;
			padding: 0.4em 0.4em;
			cursor: pointer;
			margin: 0;
			color: var(--grey-900);
		}
	}

	@media print {
		aside {
			display: none;
		}
	}
</style>
