<script>
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';

	export let folder;
	export let menu;
	export let open;
	export let folderList;

	let folderContents = menu.filter((d) => d.folder === folder);

	let expanded = false;

	function toggle() {
		// expanded = !expanded;
		open = !open;
	}
</script>

<div class="collapsible">
	<div class="folder" class:selected={$page.path === '/' + folder}>
		<button class="expandable" aria-expanded={expanded} on:click={() => (expanded = !expanded)}>
			<svg
				style="tran"
				width="13"
				height="13"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				viewBox="0 0 24 24"
				stroke="var(--grey-700)"
			>
				<path d="M9 5l7 7-7 7" /></svg
			>
		</button>

		{#if folderList.filter((d) => d.folder === folder)[0].folderLink}
			<a href={'/' + folder} aria-expanded={expanded} sveltekit:prefetch on:click={toggle}>
				{folder}
			</a>
		{:else}
			<span aria-expanded={expanded} sveltekit:prefetch on:click={toggle}>
				{folder}
			</span>
		{/if}
	</div>

	{#if expanded}
		<div class="contents" hidden={!expanded} transition:slide>
			{#each folderContents as item}
				{#if item.label != 'index' && !item.label.includes('[') && item.label !== item.folder}
					<a href={item.href} sveltekit:prefetch on:click={() => (open = !open)}>
						<div class:selected={$page.path === item.href} class="content-item">
							{item.label}
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
		color: var(--grey-800);
		display: inline-block;
		text-decoration: none;
		font-family: var(--ui-font-family);
		-webkit-font-smoothing: antialiased;
		font-size: 16px;
		color: var(--grey-700);
		cursor: pointer;
	}

	a .content-item {
		color: var(--grey-500);
	}

	.folder {
		width: 100%;
		/* padding: 0.2em 1em 0.2em 1em; */
		display: block;
	}

	.contents {
		width: 100%;
		display: block;
	}

	.contents a {
		display: block;
	}
	.content-item {
		width: 100%;
		padding: 0.2em 1em 0em 1.5em;
	}

	button {
		border: none;
		background: none;
		display: inline;
		color: inherit;
		font-size: 1em;
		cursor: pointer;
		margin-left: 0.5em;
		margin-right: 0;
		padding-top: 0.5em;
	}

	svg {
		transition: transform 0.15s ease-in;
	}

	[aria-expanded='true'] svg {
		transform: rotate(0.25turn);
	}

	.collapsible {
		display: block;
		width: 100%;
	}

	.folder:hover,
	.content-item:hover {
		background-color: var(--grey-200);
		/* transition-property: background-color;
	transition-duration: 400ms; */
	}

	.selected.content-item {
		background-color: var(--grey-200);
		color: var(--grey-999);
		font-weight: 500;
	}

	.selected {
		background-color: var(--grey-200);
		color: var(--grey-999);
		font-weight: 500;
	}
</style>
