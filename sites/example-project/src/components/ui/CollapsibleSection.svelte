<script>
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';

	export let folder;
	export let menu;
	export let open;
	export let folderList;

	let folderContents = menu.filter((d) => d.folder === folder);
	let folderLabel = folderList.filter(d => d.folder === folder)[0].folderLabel;
	let folderHrefUri = folderList.filter(d => d.folder === folder)[0].folderHrefUri;
	let expanded = false;

	function toggle() {
        if($page.path !== folderHrefUri){
		    open = !open;
			expanded = true;
        } else {
			expanded = !expanded;
		}
	}
</script>

<div class="collapsible">
	<div class="folder" class:selected={$page.path === folderHrefUri} class:folder-selected={"/" + $page.path.split('/')[1] === folderHrefUri}>
		<button class="expandable" aria-expanded={expanded} on:click={() => (expanded = !expanded)} >
			<svg
				class=collapse-icon
                class:selected={$page.path === folderHrefUri}
                class:folder-selected={"/" + $page.path.split('/')[1] === folderHrefUri}
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
		{#if folderList.filter((d) => d.folder === folder)[0].folderLink}
			<a href={'/' + folder} aria-expanded={expanded} sveltekit:prefetch on:click={toggle}>
                <div class=folder-label class:selected={$page.path === folderHrefUri} class:folder-selected={"/" + $page.path.split('/')[1] === folderHrefUri}>
				{folderLabel}
                </div>
			</a>
		{:else}
			<span class="folder-label nolink" class:folder-selected={"/" + $page.path.split('/')[1] === folderHrefUri} aria-expanded={expanded} sveltekit:prefetch on:click={() => expanded = !expanded}>
				{folderLabel}
			</span>
		{/if}
	</div>

	{#if expanded}
		<div class="contents" hidden={!expanded} transition:slide>
			{#each folderContents as item}
				{#if item.filename != 'index.md' && !item.label.includes('[')}
						<a href={item.href} sveltekit:prefetch on:click={() => (open = !open)}>
							<div class:selected={$page.path === item.hrefUri} class="content-item">
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
        width: 100%;
        height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
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
