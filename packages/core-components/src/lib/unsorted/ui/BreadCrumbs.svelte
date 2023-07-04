<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { page } from '$app/stores';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Home } from '@steeze-ui/tabler-icons';
	export let fileTree;

	$: pathArray = $page.url.pathname.split('/').slice(1);

	// check if a url is an href in the fileTree and return true or false
	const checkUrl = function (href, fileTree) {
		let found = false;
		function checkChildren(node) {
			if (node.href === href || (href.startsWith(node.href) && node.isTemplated)) {
				found = true;
			} else if (node.children) {
				node.children.forEach((child) => {
					checkChildren(child);
				});
			}
		}
		checkChildren(fileTree);
		return found;
	};

	const buildCrumbs = function (pathArray) {
		let crumbs = [
			{
				href: '/',
				title: 'Home'
			}
		];
		pathArray.forEach((path, i) => {
			if (path != '') {
				let crumb = {
					href: '/' + pathArray.slice(0, i + 1).join('/'),
					title: decodeURIComponent(path.replace(/_/g, ' ').replace(/-/g, ' '))
				};
				crumbs.push(crumb);
			}
		});
		if (crumbs.length > 3) {
			let upOne = crumbs.slice(-3)[0].href;
			crumbs.splice(1, crumbs.length - 3, { href: upOne, title: '...' });
		}

		// check in the file tree if each crumb has an href
		crumbs.forEach((path) => {
			if (!checkUrl(path.href, fileTree)) {
				path.href = 'javascript:void(0)';
			}
		});
		return crumbs;
	};

	$: crumbs = buildCrumbs(pathArray);
</script>

<!-- max-w explanation:
    100vw (initial) 
    1em + 32px (hamburger) / 18rem (sidebar) + 16px (sidebar grid gap)
    56px (page menu)

	TODO: Can this be done without magic?
-->

<div
	class="main truncate min-[850px]:max-w-[calc(100vw-18rem-16px-56px)] max-[850px]:max-w-[calc(100vw-1em-32px-56px)]"
>
	<span class="h-8 inline-flex items-center">
		{#if !$page.data.isUserPage || $page.url.pathname === '/'}
			<a href="/" class="inline-flex gap-1 items-center"
				><Icon src={Home} class="h-4 w-4 inline-block stroke-1" /> Home</a
			>
		{:else}
			{#each crumbs as crumb, i}
				{#if i > 0}
					&emsp13;/&emsp13;<a href={crumb.href}>{crumb.title}</a>
				{:else}
					<a href={crumb.href} class="inline-flex gap-1 items-center">
						{#if crumb.title === 'Home'}
							<Icon src={Home} class="h-4 w-4 inline-block stroke-1" />
						{:else}
							{crumb.title}
						{/if}
					</a>
				{/if}
			{/each}
		{/if}
	</span>
</div>

<style>
	div.main {
		padding: 0 0.5em 0 1.5em;
		box-sizing: border-box;
		width: 100%;
		white-space: nowrap;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	span {
		font-size: small;
		font-family: var(--ui-font-family-compact);
		-webkit-font-smoothing: antialiased;
		color: var(--grey-700);
	}

	a {
		text-transform: capitalize;
		text-decoration: none;
		color: var(--grey-700);
	}
	a:hover {
		color: var(--grey-999);
		transition: all 0.2s;
	}
</style>
