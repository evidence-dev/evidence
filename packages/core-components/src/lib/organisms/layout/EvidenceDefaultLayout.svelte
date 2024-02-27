<script>
	import { navigating, page } from '$app/stores';
	import { dev } from '$app/environment';
	import LoadingSkeleton from './misc/LoadingSkeleton.svelte';
	import Sidebar from './sidebar/Sidebar.svelte';
	import BreadCrumbs from './breadcrumbs/BreadCrumbs.svelte';
	import Header from './header/Header.svelte';
	import TableOfContents from './tableofcontents/TableOfContents.svelte';
	import QueryStatus from './misc/QueryStatus.svelte';
	import { ToastWrapper } from '../../molecules/toast';

	export let data;
	export let title = undefined;
	export let logo = undefined;
	export let neverShowQueries = false;
	export let fullWidth = false;
	export let hideSidebar = false;
	export let builtWithEvidence = false;

	export let algolia;

	// Social links
	export let githubRepo;
	export let xProfile;
	export let slackCommunity;

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
	<Header
		bind:mobileSidebarOpen
		{title}
		{logo}
		{neverShowQueries}
		{fullWidth}
		{githubRepo}
		{slackCommunity}
		{xProfile}
		{algolia}
	/>
	<div
		class={(fullWidth ? 'max-w-full ' : 'max-w-7xl ') +
			'print:w-[650px] mx-auto print:md:px-0 print:px-0 px-6 sm:px-8 md:px-12 flex justify-start'}
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
				<article class="select-text markdown">
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
