<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';

	export let folder;
	export let open;

	let expanded = false;

	function toggle() {
		if ($page.url.pathname.split('/')[1] != folder.href) {
			open = !open;
			expanded = true;
		} else {
			expanded = !expanded;
		}
	}
</script>

<div class="collapsible">
	<div
		class="folder"
		class:selected={$page.url.pathname === folder.href}
		class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
	>
		<button
			class="expandable"
			aria-label="expand-menu-button"
			aria-expanded={expanded}
			on:click={() => (expanded = !expanded)}
		>
			<svg
				class="collapse-icon"
				class:selected={$page.url.pathname === folder.href}
				class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
				style="tran"
				width="9"
				height="9"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="3"
				viewBox="0 0 24 24"
			>
				<path d="M9 5l7 7-7 7" /></svg
			>
		</button>
		{#if folder.href}
			<a href={folder.href} aria-expanded={expanded} on:click={toggle}>
				<div
					class="folder-label"
					class:selected={$page.url.pathname === folder.href}
					class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
				>
					{folder.label}
				</div>
			</a>
		{:else}
			<button
				class="folder-label nolink"
				class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
				aria-expanded={expanded}
				on:click={() => (expanded = !expanded)}
			>
				{folder.label}
			</button>
		{/if}
	</div>

	{#if expanded}
		<div hidden={!expanded} transition:slide>
			{#each folder.children as child}
				{#if child.href && child.label}
					<a href={child.href} on:click={toggle}>
						<div class:selected={$page.url.pathname === child.href} class="content-item">
							{child.label}
						</div>
					</a>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	a {
		text-transform: capitalize;
		display: inline-block;
		text-decoration: none;
		font-family: var(--ui-font-family);
		-webkit-font-smoothing: antialiased;
		font-size: 15px;
		color: var(--grey-700);
		cursor: pointer;
		width: 100%;
	}

	a .content-item {
		color: var(--grey-500);
	}

	.folder {
		width: 100%;
		padding: 0.2rem 1rem 0.2rem 1.2rem;
		display: grid;
		grid-template-columns: 1.2rem auto;
		margin: 0;
		padding: 0;
		gap: 0;
	}

	.folder .folder-label {
		padding: 0.2rem 1rem 0.2rem 0rem;
	}

	.folder-label {
		text-decoration: none;
		font-family: var(--ui-font-family);
		-webkit-font-smoothing: antialiased;
		font-size: 15px;
		cursor: pointer;
		text-transform: capitalize;
		color: var(--grey-700);
		display: flex;
		align-items: center;
	}

	.folder:hover .folder-label {
		color: var(--grey-900);
	}

	.folder:hover .collapse-icon {
		stroke: var(--grey-900);
	}

	.nolink {
		-webkit-user-select: none;
		user-select: none;
	}

	.content-item {
		padding: 0.2rem 1rem 0.2rem 2.25rem;
	}

	button {
		border: none;
		background: none;
		color: inherit;
		font-size: 1em;
		cursor: pointer;
		padding-right: 0rem;
		padding-left: 0.3rem;
		line-height: 1.6;
		margin: 0;
	}

	button.expandable {
		width: 1.2rem;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-right: 0;
		padding-left: 0;
	}

	svg {
		transition: transform 0.15s ease-in;
		stroke: var(--grey-700);
	}

	svg.folder-selected {
		stroke: var(--grey-999);
		stroke-width: 5;
	}

	svg.selected {
		stroke: var(--blue-600);
		stroke-width: 5;
	}

	[aria-expanded='true'] svg {
		transform: rotate(0.25turn);
	}

	.selected.content-item {
		color: var(--blue-600);
		font-weight: 500;
	}

	.folder-selected {
		color: var(--grey-999);
		font-weight: 500;
	}

	.folder.folder-selected:hover .folder-label {
		color: var(--blue-800);
	}

	.folder.folder-selected:hover .collapse-icon {
		stroke: var(--blue-800);
	}

	.content-item:hover {
		color: var(--grey-900);
	}

	.content-item.selected:hover {
		color: var(--blue-800);
	}

	.selected {
		color: var(--blue-600);
		font-weight: 500;
	}
</style>
