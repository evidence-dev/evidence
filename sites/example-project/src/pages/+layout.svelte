<!-- This get's shipped with the template -- don't do local imports from $lib -->
<script context="module">
	// Import pages and create an object structure corresponding to the file structure
	const pages = import.meta.glob(['/src/pages/*/**/+page.md']);
	let pagePaths = Object.keys(pages).map((path) => path.replace('/src/pages/', ''));

	import { fly } from 'svelte/transition';
	// Create a tree structure from the array of paths
	let fileTree = {
		label: 'Home',
		href: '/',
		children: {}
	};
	pagePaths.forEach(function (path) {
		path.split('/').reduce(function (r, e) {
			if (e === '+page.md') {
				let href = path.includes('[') ? undefined : encodeURI('/' + path.replace('/+page.md', ''));
				return (r['href'] = href);
			} else {
				let label = e.includes('[') ? undefined : e.replace(/_/g, ' ').replace(/-/g, ' ');
				return (
					r?.children[e] ||
					(r.children[e] = {
						label,
						children: {},
						href: undefined
					})
				);
			}
		}, fileTree);
	});

	// Recursively delete nodes and children nodes that don't have a label
	function deleteEmptyNodes(node) {
		if (node.children) {
			Object.keys(node.children).forEach(function (key) {
				deleteEmptyNodes(node.children[key]);
				if (!node.children[key].label && !node.children[key].href) {
					delete node.children[key];
				}
			});
		}
	}

	deleteEmptyNodes(fileTree);

	// Convert children objects into arrays of objects
	function convertChildrenToArray(node) {
		if (node.children) {
			node.children = Object.keys(node.children).map(function (key) {
				return node.children[key];
			});
			node.children.forEach(function (child) {
				convertChildrenToArray(child);
			});
		}
	}

	convertChildrenToArray(fileTree);
</script>

<script>
	import '../app.css';
	import { navigating } from '$app/stores';
	import { dev } from '$app/environment';
	import {
		LoadingSkeleton,
		Sidebar,
		BreadCrumbs,
		Header,
		TableOfContents
	} from '@evidence-dev/core-components';
	const prefetchStrategy = dev ? 'tap' : 'hover';

	let mobileSidebarOpen = false;

	$: if ($navigating) {
		mobileSidebarOpen = false;
	}
</script>

<div data-sveltekit-preload-data={prefetchStrategy} class="antialiased text-gray-900">
	<Header bind:mobileSidebarOpen />
	<div
		class="max-w-7xl print:max-w-prose mx-auto print:md:px-0 print:px-0 px-6 sm:px-8 md:px-12 flex justify-start"
	>
		<div class="print:hidden">
			<Sidebar {fileTree} bind:mobileSidebarOpen />
		</div>
		<main class="flex-1 overflow-x-hidden md:px-8 print:px-0 print:md:px-0 py-8">
			<div class="print:hidden">
				<BreadCrumbs {fileTree} />
			</div>
			{#if !$navigating}
				<!-- <div>
					<div class="inline-flex h-2 w-2 bg-green-600 rounded-full justify-center items-center">
						<div class="inline-block h-2 w-2 bg-green-600/30 rounded-full animate-ping" />
					</div>
					<span class="px-1 text-xs text-gray-500">Updated 7 hours ago</span>
				</div> -->
				<article class="select-auto">
					<slot />
				</article>
			{:else}
				<LoadingSkeleton />
			{/if}
		</main>
		<div class="print:hidden">
			<TableOfContents /> 
		</div>
	</div>
</div>
