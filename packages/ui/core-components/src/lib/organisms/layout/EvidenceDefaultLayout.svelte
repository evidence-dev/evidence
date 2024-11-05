<script>
	import { navigating, page } from '$app/stores';
	import { dev } from '$app/environment';
	import { LoadingSkeleton, QueryStatus } from './misc';
	import { Sidebar } from './sidebar';
	import { Header } from './header';
	import { ToastWrapper } from '../../molecules/toast';
	import BreadCrumbs from './BreadCrumbs.svelte';
	import TableOfContents from './tableofcontents/TableOfContents.svelte';
	import ErrorOverlay from './ErrorOverlay.svelte';
	import { browser } from '$app/environment';
	import DevTools from '../../devtools/DevTools.svelte';
	import { onMount } from 'svelte';
	import { ensureThemeStores } from '../../themes.js';

	// Remove splash screen from app.html
	if (browser) {
		const splash = document.getElementById('__evidence_project_splash');
		splash?.remove();
	}

	export let data;

	// Layout options
	/** @type {string} */
	export let title = undefined;
	/** @type {string} */
	export let logo = undefined;
	/** @type {boolean} */
	export let neverShowQueries = false;
	/** @type {boolean} */
	export let fullWidth = false;
	/** @type {boolean} */
	export let hideSidebar = false;
	/** @type {boolean} */
	export let builtWithEvidence = false;
	/** @type {{appId: string, apiKey: string, indexName: string}} */
	export let algolia = undefined;
	/** @type {string} */
	export let githubRepo = undefined;
	/** @type {string} */
	export let xProfile = undefined;
	/** @type {string} */
	export let slackCommunity = undefined;
	/** @type {string}*/
	export let maxWidth = undefined;
	/** @type {string}*/
	export let homePageName = "Home";
	/** @type {boolean} */
	export let hideBreadcrumbs = false;
	/** @type {boolean} */
	export let hideHeader = false;
	/** @type {boolean} */
	export let hideTOC = false;

	const prefetchStrategy = dev ? 'tap' : 'hover';

	let mobileSidebarOpen = false;

	$: if ($navigating) {
		mobileSidebarOpen = false;
	}

	let fileTree = data?.pagesManifest;

	function convertFileTreeToFileMap(fileTree) {
		const map = new Map();

		function traverse(node) {
			if (!node) {
				return;
			}

			if (node.href) {
				const decodedHref = decodeURI(node.href);
				map.set(decodedHref, node);
			}

			Object.values(node.children).forEach(traverse);
		}

		traverse(fileTree);

		return map;
	}

	$: fileMap = convertFileTreeToFileMap(fileTree);

	$: routeFrontMatter = fileMap.get($page.route.id)?.frontMatter;

	$: sidebarFrontMatter = routeFrontMatter?.sidebar;

	$: if (!['show', 'hide', 'never'].includes(sidebarFrontMatter)) {
		sidebarFrontMatter = undefined;
	}

	onMount(() => {
		if (!('serviceWorker' in navigator)) return;

		const registerServiceWorker = () => {
			navigator.serviceWorker.register('/service-worker.js');
		};

		window.addEventListener('load', registerServiceWorker);
		return () => {
			window.removeEventListener('load', registerServiceWorker);
		};
	});

	// TODO where should this go? How do we get project splash to be rendered with the proper theme?
	ensureThemeStores();
</script>

<slot />

<ToastWrapper />
<DevTools>
	<div data-sveltekit-preload-data={prefetchStrategy} class="antialiased text-gray-900">
		<ErrorOverlay />
		{#if !hideHeader}
			<Header
				bind:mobileSidebarOpen
				{title}
				{logo}
				{neverShowQueries}
				{fullWidth}
				{maxWidth}
				{hideSidebar}
				{githubRepo}
				{slackCommunity}
				{xProfile}
				{algolia}
				{sidebarFrontMatter}
			/>
		{/if}
		<div
			class={(fullWidth ? 'max-w-full ' : maxWidth ? '' : ' max-w-7xl ') +
				'print:w-[650px] print:md:w-[841px] mx-auto print:md:px-0 print:px-0 px-6 sm:px-8 md:px-12 flex justify-start'}
			style="max-width:{maxWidth}px;"
		>
			{#if !hideSidebar && sidebarFrontMatter !== 'never'}
				<div class="print:hidden">
					<Sidebar
						{fileTree}
						bind:mobileSidebarOpen
						{title}
						{logo}
						{homePageName}
						{builtWithEvidence}
						{hideHeader}
						{sidebarFrontMatter}
					/>
				</div>
			{/if}
			<main
				class={(!hideSidebar ? 'md:pl-8 ' : '') +
					(!hideTOC ? 'md:pr-8 ' : '') +
					(!hideHeader
						? !hideBreadcrumbs
							? ' mt-16 sm:mt-20 '
							: ' mt-16 sm:mt-[74px] '
						: !hideBreadcrumbs
							? ' mt-4 sm:mt-8 '
							: ' mt-4 sm:mt-[26px] ') +
					'flex-grow overflow-x-hidden print:px-0 print:mt-8'}
			>
				{#if !hideBreadcrumbs}
					<div class="print:hidden">
						{#if $page.route.id !== '/settings'}
							<BreadCrumbs {fileTree} />
						{/if}
					</div>
				{/if}
				{#if !$navigating}
					<article id="evidence-main-article" class="select-text markdown pb-10">
						<slot name="content" />
					</article>
				{:else}
					<LoadingSkeleton />
				{/if}
			</main>
			{#if !hideTOC}
				<div class="print:hidden">
					<TableOfContents {hideHeader} />
				</div>
			{/if}
		</div>
	</div>
	{#if !$navigating && dev && !$page.url.pathname.startsWith('/settings')}
		<QueryStatus />
	{/if}
</DevTools>
