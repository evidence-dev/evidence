<!-- This get's shipped with the template -- don't do local imports from $lib -->
<script context="module">
	// Import pages and create an object structure corresponding to the file structure
	const pages = import.meta.glob(['/src/pages/*/**/+page.md']);
	let pagePaths = Object.keys(pages).map((path) => path.replace('/src/pages/', ''));

	// Create a tree structure from the array of paths
	let fileTree = {
		label: 'Home',
		href: '/',
		children: {},
		isTemplated: false
	};
	pagePaths.forEach(function (path) {
		path.split('/').reduce(function (r, e) {
			if (e === '+page.md') {
				let href = path.includes('[') ? undefined : encodeURI('/' + path.replace('/+page.md', ''));
				return (r['href'] = href);
			} else {
				let label = e.includes('[') ? undefined : e.replace(/_/g, ' ').replace(/-/g, ' ');
				r.isTemplated = e.includes('[');
				return (
					r?.children[e] ||
					(r.children[e] = {
						label,
						children: {},
						href: undefined,
						isTemplated: false
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
	import { blur } from 'svelte/transition';
	import { dev } from '$app/environment';

	export let data;

	let open = false;
	//TODO: Offer this as a build parameter
	// in dev. mode prevent prefetch on "hover"
	const prefetchStrategy = dev ? 'tap' : 'hover';
</script>

<!-- eslint-disable no-undef -->

{#if $navigating}
	<LoadingIndicator />
{/if}

<div data-sveltekit-preload-data={prefetchStrategy} class="grid">
	<div class="header-bar">
		<Header {fileTree} bind:open />
	</div>
	<Sidebar bind:open {fileTree} />
	{#if !$navigating}
		<main in:blur|local id="evidence-content">
			<div class="content" class:settings-content={!data.isUserPage}>
				<article class:settings-article={!data.isUserPage}>
					<slot />
					<p>&nbsp;</p>
				</article>
				{#if data.isUserPage}
					<aside class="toc">
						<TableOfContents />
					</aside>
				{/if}
			</div>
		</main>
	{/if}
</div>
{#if !$navigating && dev && data.isUserPage}
	<QueryStatus />
{/if}

<style>
	.grid {
		display: grid;
		grid-template-areas:
			'sidebar header'
			'sidebar main';
		grid-template-columns: 18rem 5fr;
		grid-template-rows: var(--header-height) 1fr;
		gap: 0 16px;
		margin: 0 auto;
		isolation: isolate;
	}

	main {
		grid-area: main;
	}

	div.content {
		margin: auto;
		max-width: 100ch;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: 4fr minmax(0, 1fr);
		gap: 0 5ch;
		grid-template-areas: 'article toc';
		justify-items: left;
	}

	article {
		max-width: 70ch;
		min-width: 0;
		width: 100%;
		grid-area: article;
		padding: 0 1.5em 0 1.5em;
		box-sizing: border-box;
		user-select: text;
		-moz-user-select: text;
		-webkit-user-select: text;
		-ms-user-select: text;
	}

	.settings-content {
		max-width: 100ch !important;
		grid-template-columns: 1fr !important;
		grid-template-areas: 'article' !important;
	}

	.settings-article {
		max-width: 100ch;
		min-width: 0;
		width: 100%;
		grid-area: article;
		padding: 0 1.5em 0 1.5em;
		box-sizing: border-box;
	}
	aside.toc {
		grid-area: toc;
		padding: 0px;
	}

	.header-bar {
		display: flex;
		justify-content: space-between;
		position: sticky;
		z-index: 2;
		top: 0;
		background-color: rgba(255, 255, 255, 0.73);
		-webkit-backdrop-filter: blur(10px) saturate(1.8);
		backdrop-filter: blur(10px) saturate(1.8);
	}

	@media (max-width: 1440px) {
		div.content {
			grid-template-columns: 1fr;
			grid-template-areas: 'article';
		}

		article {
			max-width: 70ch;
		}

		.settings-article {
			max-width: 100ch;
		}

		.settings-content {
			max-width: 100ch !important;
			grid-template-columns: 1fr !important;
			grid-template-areas: 'article' !important;
		}

		aside.toc {
			display: none;
		}
	}

	@media (max-width: 850px) {
		.grid {
			display: grid;
			grid-template-areas:
				'header'
				'main';
			grid-template-columns: 1fr;
			grid-template-rows: var(--header-height) 1fr;
			margin: 0 auto;
			isolation: isolate;
		}
	}

	@media print {
		main * {
			visibility: hidden;
		}

		.header-bar {
			visibility: hidden;
		}
		article,
		article * {
			visibility: visible;
		}
		article {
			position: absolute;
			left: 0;
			top: 0;
		}
	}
</style>
