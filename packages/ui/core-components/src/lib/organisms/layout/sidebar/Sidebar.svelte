<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { fly, fade } from 'svelte/transition';
	import { lock, unlock } from 'tua-body-scroll-lock';
	import { afterUpdate } from 'svelte';
	import Badge from './Badge.svelte';
	import Logo from '../Logo.svelte';

	export let fileTree = undefined;
	export let title = undefined;
	export let logo = undefined;
	export let homePageName = undefined;
	export let builtWithEvidence = undefined;
	export let hideHeader = false;
	export let sidebarFrontMatter = undefined;

	function deleteEmptyNodes(node) {
		Object.keys(node.children).forEach(function (key) {
			deleteEmptyNodes(node.children[key]);
			if (!node.children[key].label && !node.children[key].href) {
				delete node.children[key];
			}
		});
	}

	// sort children arrays by sidebar_position
	function sortChildrenBySidebarPosition(node) {
		node.children = Object.values(node.children).sort((a, b) => {
			if (!isNaN(a.frontMatter?.sidebar_position) && !isNaN(b.frontMatter?.sidebar_position)) {
				return (
					a.frontMatter.sidebar_position - b.frontMatter.sidebar_position ||
					a.label.localeCompare(b.label)
				);
			} else if (!isNaN(a.frontMatter?.sidebar_position)) {
				return -1;
			} else if (!isNaN(b.frontMatter?.sidebar_position)) {
				return 1;
			} else {
				return a.label.localeCompare(b.label);
			}
		});
		node.children.forEach(sortChildrenBySidebarPosition);
		return node;
	}

	fileTree = structuredClone(fileTree);
	deleteEmptyNodes(fileTree);
	fileTree = sortChildrenBySidebarPosition(fileTree);

	// children of the index page
	let firstLevelFiles = fileTree?.children;

	export let mobileSidebarOpen = false;

	// prevent scrolling of the underlying when the mobile sidebar is open
	afterUpdate(() => {
		// afterupdate ensures that the mobileScrollable div is mounted before we lock everything else
		if (browser) {
			let scrollableElement = document.querySelector('#mobileScrollable');
			if (!mobileSidebarOpen) {
				unlock(scrollableElement); // unlock body scroll
			} else {
				lock(scrollableElement); // lock body scroll
			}
		}
	});
</script>

{#if mobileSidebarOpen}
	<div
		class="fixed inset-0 bg-white/80 z-50 backdrop-blur-sm"
		transition:fade|local={{ duration: 100 }}
		on:click={() => (mobileSidebarOpen = false)}
		on:keypress={() => (mobileSidebarOpen = false)}
		role="button"
		tabindex="-1"
	/>
	<div
		class="bg-white border-r border-gray-300 shadow-lg fixed inset-0 z-50 flex sm:w-72 h-screen w-screen flex-col overflow-hidden select-none"
		in:fly|local={{ x: -50, duration: 300 }}
		out:fly|local={{ x: -100, duration: 200 }}
	>
		<div class=" pb-4 text-gray-700">
			<div class="py-3 px-8 mb-3 flex items-start justify-between">
				<a href="/" class="block mt-1 text-sm font-bold text-gray-800">
					<Logo {logo} {title} />
				</a>
				<span
					role="button"
					tabindex="-1"
					on:click={() => (mobileSidebarOpen = false)}
					on:keypress={() => (mobileSidebarOpen = false)}
				>
					<button
						type="button"
						class="text-gray-900 hover:bg-gray-100 rounded-lg p-1 transition-all duration-500"
						on:click={() => {
							mobileSidebarOpen = false;
						}}
					>
						<span class="sr-only">Close sidebar</span>

						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-5 h-5"
						>
							<path
								d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
							/>
						</svg>
					</button>
				</span>
			</div>
			<div
				class="flex-grow px-8 sm:pb-0 pb-4 h-[calc(100vh-8rem)] overflow-auto text-base sm:text-sm pretty-scrollbar"
				id="mobileScrollable"
			>
				<div class="flex flex-col pb-6">
					<a
						class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100"
						href="/"
					>
						{homePageName}
					</a>
					{#each firstLevelFiles as file}
						{#if file.children.length === 0 && file.href && (file.frontMatter?.sidebar_link !== false || file.frontMatter?.sidebar_link === undefined)}
							{@const active = $page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
							<a
								class="group inline-block py-1 capitalize transition-colors duration-100"
								href={file.href}
								class:text-blue-600={active}
								class:hover:text-gray-950={active}
								class:hover:text-blue-600={active}
							>
								{file.frontMatter?.title ?? file.label}
								{#if file.frontMatter?.sidebar_badge}
									<Badge>
										{file.frontMatter.sidebar_badge}
									</Badge>
								{/if}
							</a>
						{/if}
					{/each}
				</div>
				{#each firstLevelFiles as file}
					{#if file.children.length > 0}
						<div class="flex flex-col pb-6">
							{#if file.href && (file.frontMatter?.sidebar_link !== false || file.frontMatter?.sidebar_link === undefined)}
								<a
									class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100"
									href={file.href}
								>
									{file.frontMatter?.title ?? file.label}
									{#if file.frontMatter?.sidebar_badge}
										<Badge>
											{file.frontMatter.sidebar_badge}
										</Badge>
									{/if}
								</a>
							{:else}
								<span
									class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100"
									href={file.href}
								>
									{file.frontMatter?.title ?? file.label}
									{#if file.frontMatter?.sidebar_badge}
										<Badge>
											{file.frontMatter.sidebar_badge}
										</Badge>
									{/if}
								</span>
							{/if}
							{#each file.children as file}
								{#if file.href}
									{@const active =
										$page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
									<a
										class="group inline-block py-1 capitalize transition-colors duration-100"
										href={file.href}
										class:text-blue-600={active}
										class:hover:text-gray-950={!active}
										class:hover:text-blue-600={active}
									>
										{file.frontMatter?.title ?? file.label}
										{#if file.frontMatter?.sidebar_badge}
											<Badge>
												{file.frontMatter.sidebar_badge}
											</Badge>
										{/if}
									</a>
								{/if}
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Desktop Sidebar -->
<aside class="w-48 flex-none {sidebarFrontMatter === 'hide' ? 'hidden' : 'hidden md:flex'}">
	{#if !mobileSidebarOpen}
		<div
			class="hidden: md:block fixed w-48 top-20 bottom-8 overflow-y-auto flex-1 text-sm text-gray-500 pretty-scrollbar"
			class:top-8={hideHeader}
		>
			<div class="flex flex-col pb-6">
				<a
					class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize hover:underline"
					href="/"
				>
					{homePageName}
				</a>
				{#each firstLevelFiles as file}
					{#if file.children.length === 0 && file.href && (file.frontMatter?.sidebar_link !== false || file.frontMatter?.sidebar_link === undefined)}
						{@const active = $page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
						<a
							class="group inline-block py-1 capitalize transition-all duration-100"
							href={file.href}
							class:text-blue-600={active}
							class:hover:text-gray-950={!active}
							class:hover:text-blue-600={active}
						>
							{file.frontMatter?.title ?? file.label}
							{#if file.frontMatter?.sidebar_badge}
								<Badge>
									{file.frontMatter.sidebar_badge}
								</Badge>
							{/if}
						</a>
					{/if}
				{/each}
			</div>
			{#each firstLevelFiles as file}
				{#if file.children.length > 0}
					<div class="flex flex-col pb-6">
						{#if file.href && (file.frontMatter?.sidebar_link !== false || file.frontMatter?.sidebar_link === undefined)}
							<a
								class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group block capitalize hover:underline"
								href={file.href}
							>
								{file.frontMatter?.title ?? file.label}
								{#if file.frontMatter?.sidebar_badge}
									<Badge>
										{file.frontMatter.sidebar_badge}
									</Badge>
								{/if}
							</a>
						{:else}
							<span
								class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize"
								href={file.href}
							>
								{file.frontMatter?.title ?? file.label}
								{#if file.frontMatter?.sidebar_badge}
									<Badge>
										{file.frontMatter.sidebar_badge}
									</Badge>
								{/if}
							</span>
						{/if}
						{#each file.children as file}
							{#if file.href && (file.frontMatter?.sidebar_link !== false || file.frontMatter?.sidebar_link === undefined)}
								{@const active = $page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
								<a
									href={file.href}
									class:text-blue-600={active}
									class:hover:text-blue-600={active}
									class:hover:text-gray-950={!active}
									class="group inline-block py-1 capitalize transition-all duration-100"
								>
									{file.frontMatter?.title ?? file.label}
									{#if file.frontMatter?.sidebar_badge}
										<Badge>
											{file.frontMatter.sidebar_badge}
										</Badge>
									{/if}
								</a>
							{/if}
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
	{#if builtWithEvidence}
		<div class="fixed bottom-0 text-xs py-2">
			<a
				href="https://www.evidence.dev"
				class="bg-gradient-to-r inline-block text-gray-950 antialiased font-medium"
			>
				Built with Evidence</a
			>
		</div>
	{/if}
</aside>
