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
	import { getThemeStores } from '../../themes/themes.js';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';

	// Remove splash screen from app.html
	if (browser) {
		const splash = document.getElementById('__evidence_project_splash');
		splash?.remove();
	}

	export let data;

	// Layout options
	/** @type {string} */
	export let title = undefined;
	/** @type {string | undefined} */
	export let logo = undefined;
	/** @type {string | undefined} */
	export let lightLogo = undefined;
	/** @type {string | undefined} */
	export let darkLogo = undefined;
	/** @type {boolean} */
	export let neverShowQueries = false;
	/** @type {boolean} */
	export let fullWidth = false;
	/** @type {boolean} */
	export let hideSidebar = false;
	/** @type {boolean} */
	export let builtWithEvidence = true;
	/** @type {{appId: string, apiKey: string, indexName: string}} */
	export let algolia = undefined;
	/** @type {string} */
	export let githubRepo = undefined;
	/** @type {string} */
	export let xProfile = undefined;
	/** @type {string} */
	export let blueskyProfile = undefined;
	/** @type {string} */
	export let slackCommunity = undefined;
	/** @type {string}*/
	export let maxWidth = undefined;
	/** @type {string}*/
	export let homePageName = 'Home';
	/** @type {boolean} */
	export let hideBreadcrumbs = false;
	/** @type {boolean} */
	export let hideHeader = false;
	/** @type {boolean} */
	export let hideTOC = false;
	/** @type {number} */
	export let sidebarDepth = 3;

	const prefetchStrategy = dev ? 'tap' : 'hover';

	let mobileSidebarOpen = false;

	$: if ($navigating) {
		mobileSidebarOpen = false;
	}

	let fileTree = data?.pagesManifest;

	function convertFileTreeToFileMap(fileTree) {
		const map = new Map();

		function traverse(node, currentPath = '') {
			// Build the full path for the current node
			const fullPath = node.href || currentPath;

			// Add the current node to the map if it's a page
			if (node.isPage) {
				map.set(decodeURI(fullPath), node);
			}

			// Traverse children
			if (node.children) {
				Object.entries(node.children).forEach(([key, child]) => {
					const childPath = `${fullPath}/${key}`;
					traverse(child, childPath);
				});
			}
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

	$: hideBreadcrumbsFrontmatter = routeFrontMatter?.hide_breadcrumbs;
	$: hideBreadcrumbsEffective = hideBreadcrumbsFrontmatter ?? hideBreadcrumbs;

	$: fullWidthFrontmatter = routeFrontMatter?.full_width;
	$: fullWidthEffective = fullWidthFrontmatter ?? fullWidth;

	$: maxWidthFrontmatter = routeFrontMatter?.max_width;
	$: maxWidthEffective = maxWidthFrontmatter ?? maxWidth;

	$: hideHeaderFrontmatter = routeFrontMatter?.hide_header;
	$: hideHeaderEffective = hideHeaderFrontmatter ?? hideHeader;

	$: hideTocFrontmatter = routeFrontMatter?.hide_toc;
	$: hideTocEffective = hideTocFrontmatter ?? hideTOC;

	onMount(async () => {
		if (!('serviceWorker' in navigator)) return;

		const registration = await navigator.serviceWorker.register(
			addBasePath('/fix-tprotocol-service-worker.js'),
			{
				scope: addBasePath('/'),
				type: dev ? 'module' : 'classic'
			}
		);
		console.debug('[fix-tprotocol-service-worker] Service Worker registered', { registration });
	});

	const {
		syncDataThemeAttribute,
		cycleAppearance,
		selectedAppearance,
		setAppearance,
		activeAppearance
	} = getThemeStores();

	onMount(() => {
		/** @param {KeyboardEvent} e */
		const onKeydown = (e) => {
			if (e.key.toLowerCase() === 'l' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
				cycleAppearance();
			}
		};
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	onMount(() => syncDataThemeAttribute(document.querySelector('html')));

	//handles printing in dark mode
	onMount(() => {
		let currentTheme;

		const beforePrintHandler = () => {
			currentTheme = $activeAppearance;
			if ($selectedAppearance === 'dark') {
				setAppearance('light');
			}
		};

		const afterPrintHandler = () => {
			if (currentTheme === 'dark') {
				setAppearance('dark');
			}
		};

		window.addEventListener('beforeprint', beforePrintHandler);
		window.addEventListener('afterprint', afterPrintHandler);

		return () => {
			window.removeEventListener('beforeprint', beforePrintHandler);
			window.removeEventListener('afterprint', afterPrintHandler);
		};
	});
</script>

<slot />

<ToastWrapper />
<DevTools>
	<div data-sveltekit-preload-data={prefetchStrategy} class="antialiased">
		<ErrorOverlay />
		{#if !hideHeaderEffective}
			<Header
				bind:mobileSidebarOpen
				{title}
				{logo}
				{lightLogo}
				{darkLogo}
				{neverShowQueries}
				fullWidth={fullWidthEffective}
				maxWidth={maxWidthEffective}
				{hideSidebar}
				{githubRepo}
				{slackCommunity}
				{xProfile}
				{blueskyProfile}
				{algolia}
				{sidebarFrontMatter}
			/>
		{/if}
		<div
			class={(fullWidthEffective ? 'max-w-full ' : maxWidthEffective ? '' : ' max-w-7xl ') +
				'print:w-[650px] print:md:w-[841px] mx-auto print:md:px-0 print:px-0 px-6 sm:px-8 md:px-12 flex justify-start'}
			style="max-width:{maxWidthEffective}px;"
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
						hideHeader={hideHeaderEffective}
						{sidebarFrontMatter}
						{sidebarDepth}
					/>
				</div>
			{/if}
			<main
				class={(!hideSidebar && !['hide', 'never'].includes(sidebarFrontMatter) ? 'md:pl-8 ' : '') +
					(!hideTocEffective ? 'md:pr-8 ' : '') +
					(!hideHeaderEffective
						? !hideBreadcrumbsEffective
							? ' mt-16 sm:mt-20 '
							: ' mt-16 sm:mt-[74px] '
						: !hideBreadcrumbsEffective
							? ' mt-4 sm:mt-8 '
							: ' mt-4 sm:mt-[26px] ') +
					'flex-grow overflow-x-hidden print:px-0 print:mt-8'}
			>
				{#if !hideBreadcrumbsEffective}
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
			{#if !hideTocEffective}
				<div class="print:hidden">
					<TableOfContents hideHeader={hideHeaderEffective} />
				</div>
			{/if}
		</div>
	</div>
	{#if !$navigating && dev && !$page.url.pathname.startsWith('/settings')}
		<QueryStatus />
	{/if}
</DevTools>

<style lang="postcss">
	:global(body) {
		@apply bg-base-100 text-base-content;
	}
</style>
