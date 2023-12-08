<script>
	import { page } from '$app/stores';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronRight } from '@steeze-ui/tabler-icons';
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
				path.href = null;
			}
		});
		return crumbs;
	};

	$: crumbs = buildCrumbs(pathArray);
</script>

<div class="flex items-start mt-8 sm:mt-12 whitespace-nowrap overflow-auto">
	<div class="inline-flex items-center text-sm capitalize gap-1 text-gray-500 mb-2 sm:mb-4">
		{#each crumbs as crumb, i}
			{#if i > 0}
				<Icon src={ChevronRight} size="12px" theme="solid" />
				{#if crumb.href}
					<a href={crumb.href} class="hover:underline">{crumb.title}</a>
				{:else}
					<span class=" cursor-default">{crumb.title}</span>
				{/if}
			{:else}
				<a href={crumb.href} class="hover:underline">
					{crumb.title}
				</a>
			{/if}
		{/each}
	</div>
</div>
