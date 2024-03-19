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
	export let algolia;
	/** @type {string} */
	export let githubRepo;
	/** @type {string} */
	export let xProfile;
	/** @type {string} */
	export let slackCommunity;
	/** @type {string}*/
	export let maxWidth = undefined;

	const prefetchStrategy = dev ? 'tap' : 'hover';

	let mobileSidebarOpen = false;

	$: if ($navigating) {
		mobileSidebarOpen = false;
	}

	let fileTree = data?.pagesManifest;
</script>

<slot />

<ToastWrapper />

<div data-sveltekit-preload-data={prefetchStrategy} class="antialiased text-gray-900">
	<ErrorOverlay />
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
	/>
	<div
		class={(fullWidth ? 'max-w-full ' : maxWidth ? '' : ' max-w-7xl ') +
			'print:w-[650px] mx-auto print:md:px-0 print:px-0 px-6 sm:px-8 md:px-12 flex justify-start'}
		style="max-width:{maxWidth}px;"
	>
		{#if !hideSidebar}
			<div class="print:hidden">
				<Sidebar {fileTree} bind:mobileSidebarOpen {title} {logo} {builtWithEvidence} />
			</div>
		{/if}
		<main
			class={(!hideSidebar ? 'md:px-8 ' : '') +
				'flex-grow overflow-x-hidden print:px-0 print:md:px-0 py-8'}
		>
			<div class="print:hidden">
				{#if $page.route.id !== '/settings'}
					<BreadCrumbs {fileTree} />
				{/if}
			</div>
			{#if !$navigating}
				<article id="evidence-main-article" class="select-text markdown">
					<slot name="content" />
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
{#if !$navigating && dev && !$page.url.pathname.startsWith('/settings')}
	<QueryStatus />
{/if}