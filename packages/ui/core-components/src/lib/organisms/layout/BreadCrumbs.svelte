<script context="module">
	export function searchFileTree(href, fileTree) {
		if (href === '/') return fileTree;
		const pathArray = href.split('/').slice(1);
		let node = fileTree;
		for (let path of pathArray) {
			if (!node.children[path]) {
				node = Object.values(node.children).find((child) => child.isTemplated);
			} else {
				node = node.children[path];
			}
			if (!node) return null;
		}
		return node;
	}

	export function buildCrumbs(pathArray, fileTree) {
		const crumbs = [{ href: '/', title: 'Home' }];
		pathArray.forEach((path, i) => {
			if (path != '') {
				crumbs.push({
					href: '/' + pathArray.slice(0, i + 1).join('/'),
					title: decodeURIComponent(path.replace(/_/g, ' ').replace(/-/g, ' '))
				});
			}
		});

		if (crumbs.length > 3) {
			crumbs.splice(1, crumbs.length - 3, { href: crumbs.slice(-3)[0].href, title: '...' });
		}

		for (const path of crumbs) {
			if (path.href === '/') {
				// Special case for Home page
				path.href = '/';
				path.title = 'Home';
			} else {
				const node = searchFileTree(path.href, fileTree);
				if (!node || !node.isPage) {
					path.href = null;
				} else {
					path.title = node.title ?? path.title;
				}
			}
		}

		return crumbs;
	}
</script>

<script>
	import { page } from '$app/stores';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronRight } from '@steeze-ui/tabler-icons';
	import { buildUrl } from '@evidence-dev/sdk/utils/svelte';
	export let fileTree;

	$: crumbs = buildCrumbs($page.url.pathname.split('/').slice(1), fileTree);
</script>

<div class="flex items-start mt-0 whitespace-nowrap overflow-auto">
	<div class="inline-flex items-center text-sm capitalize gap-1 text-gray-500 mb-2 sm:mb-4">
		{#each crumbs as crumb, i}
			{#if i > 0}
				<Icon src={ChevronRight} size="12px" theme="solid" />
				{#if crumb.href}
					<a href={buildUrl(crumb.href)} class="hover:underline">{crumb.title}</a>
				{:else}
					<span class=" cursor-default">{crumb.title}</span>
				{/if}
			{:else}
				<a href={buildUrl(crumb.href)} class="hover:underline">
					{crumb.title}
				</a>
			{/if}
		{/each}
	</div>
</div>
