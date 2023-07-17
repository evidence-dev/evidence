<!-- This get's shipped with the template -- don't do local imports from $lib -->
<script context="module">
	// Import pages and create an object structure corresponding to the file structure
	const pages = import.meta.glob(['/src/pages/*/**/+page.md']);
	let pagePaths = Object.keys(pages).map((path) => path.replace('/src/pages/', ''));

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
	import '../fonts.css';
	import '../app.css';

	import { navigating } from '$app/stores';
	import { dev } from '$app/environment';
	import { Header, Sidebar, LoadingSkeleton } from '@evidence-dev/core-components';
	let open = false;
	const prefetchStrategy = dev ? 'tap' : 'hover';

	let mobileSidebarOpen = false;

	$: if ($navigating) {
		mobileSidebarOpen = false;
	}
</script>

<div data-sveltekit-preload-data={prefetchStrategy} class="antialiased">
	<Header bind:mobileSidebarOpen />
	<Sidebar {fileTree} bind:mobileSidebarOpen />
	<div class="lg:pl-72">
		<main class="py-10">
			<div class="px-4 sm:px-6 lg:px-8">
				<article class="max-w-3xl mx-auto">
					{#if !$navigating}
						<slot />
					{:else}
						<LoadingSkeleton /> 
					{/if}
				</article>
			</div>
		</main>
	</div>
</div>
