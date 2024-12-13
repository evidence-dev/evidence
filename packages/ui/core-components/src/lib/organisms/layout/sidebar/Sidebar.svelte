<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { fly, fade } from 'svelte/transition';
	import { lock, unlock } from 'tua-body-scroll-lock';
	import { afterUpdate } from 'svelte';
	import Badge from './Badge.svelte';
	import Logo from '../Logo.svelte';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { X } from '@steeze-ui/tabler-icons';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';

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
		class="fixed inset-0 bg-base-100/80 z-50 backdrop-blur-sm"
		transition:fade|local={{ duration: 100 }}
		on:click={() => (mobileSidebarOpen = false)}
		on:keypress={() => (mobileSidebarOpen = false)}
		role="button"
		tabindex="-1"
	/>
	<div
		class="bg-base-100 border-r border-base-200 shadow-lg fixed inset-0 z-50 flex sm:w-72 h-screen w-screen flex-col overflow-hidden select-none"
		in:fly|local={{ x: -50, duration: 300 }}
		out:fly|local={{ x: -100, duration: 200 }}
	>
		<div class="flex flex-col h-full pb-4">
			<div class="py-3 px-8 mb-3 flex items-start justify-between">
				<a href={addBasePath('/')} class="block mt-1 text-sm font-bold">
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
						class="hover:bg-base-200 rounded-lg p-1 transition-all duration-500"
						on:click={() => {
							mobileSidebarOpen = false;
						}}
					>
						<span class="sr-only">Close sidebar</span>
						<Icon src={X} class="w-5 h-5" />
					</button>
				</span>
			</div>
			<div
				class="flex-1 px-8 sm:pb-0 pb-4 overflow-auto text-base sm:text-sm pretty-scrollbar"
				id="mobileScrollable"
			>
				<div class="flex flex-col pb-6">
					<a
						class="sticky top-0 bg-base-100 shadow shadow-base-100 text-base-heading font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100"
						href={addBasePath('/')}
					>
						{homePageName}
					</a>
					{#each firstLevelFiles as file}
						{#if file.children.length === 0 && file.href && (file.frontMatter?.sidebar_link !== false || file.frontMatter?.sidebar_link === undefined)}
							{@const active = $page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
							<a
								class="group inline-block py-1 capitalize transition-colors duration-100 {active
									? 'text-primary'
									: 'text-base-content-muted hover:text-base-content'}"
								href={addBasePath(file.href)}
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
									class="sticky top-0 bg-base-100 shadow shadow-base-100 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100 text-base-heading"
									href={addBasePath(file.href)}
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
									class="sticky top-0 bg-base-100 shadow shadow-base-100 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100 text-base-heading"
									href={addBasePath(file.href)}
								>
									{file.frontMatter?.title ?? file.label}
									{#if file.frontMatter?.sidebar_badge}
										<Badge>
											{file.frontMatter.sidebar_badge}
										</Badge>
									{/if}
								</span>
							{/if}
							{#each file.children as secondLevelFile}
								{#if secondLevelFile.href && (secondLevelFile.frontMatter?.sidebar_link !== false || secondLevelFile.frontMatter?.sidebar_link === undefined)}
									{@const active =
										$page.url.pathname.toUpperCase() === secondLevelFile.href.toUpperCase() + '/'}
									<a
										class="group inline-block py-1 capitalize transition-colors duration-100 {active
											? 'text-primary'
											: 'text-base-content-muted hover:text-base-content'}"
										href={addBasePath(secondLevelFile.href)}
									>
										{secondLevelFile.frontMatter?.title ?? secondLevelFile.label}
										{#if secondLevelFile.frontMatter?.sidebar_badge}
											<Badge>
												{secondLevelFile.frontMatter.sidebar_badge}
											</Badge>
										{/if}
									</a>
								{:else}
									<span
										class="group inline-block py-1 capitalize transition-all duration-100 text-base-content-muted"
									>
										{secondLevelFile.frontMatter?.title ?? secondLevelFile.label}
										{#if secondLevelFile.frontMatter?.sidebar_badge}
											<Badge>
												{secondLevelFile.frontMatter.sidebar_badge}
											</Badge>
										{/if}
									</span>
								{/if}
								{#if secondLevelFile.children.length > 0}
									<div class="flex flex-col">
										{#each secondLevelFile.children as thirdLevelFile}
											{#if thirdLevelFile.href && (thirdLevelFile.frontMatter?.sidebar_link !== false || thirdLevelFile.frontMatter?.sidebar_link === undefined)}
												{@const active =
													$page.url.pathname.toUpperCase() ===
													thirdLevelFile.href.toUpperCase() + '/'}
												<a
													href={addBasePath(thirdLevelFile.href)}
													class="group inline-block py-1 first:pt-0.5 first:mt-1 last:pb-0.5 last:mb-1 pl-3 capitalize transition-all duration-100 border-l ml-1 {active
														? 'text-primary border-primary'
														: 'text-base-content-muted hover:text-base-content hover:border-base-content'}"
												>
													{thirdLevelFile.frontMatter?.title ?? thirdLevelFile.label}
													{#if thirdLevelFile.frontMatter?.sidebar_badge}
														<Badge>
															{thirdLevelFile.frontMatter.sidebar_badge}
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
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Desktop Sidebar -->
<aside class="w-48 flex-none {sidebarFrontMatter === 'hide' ? 'hidden' : 'hidden md:flex'}">
	{#if !mobileSidebarOpen}
		<div
			class="hidden: md:block fixed w-48 top-20 bottom-8 overflow-y-auto flex-1 text-sm pretty-scrollbar"
			class:top-8={hideHeader}
		>
			<div class="flex flex-col pb-6">
				<a
					class="sticky top-0 bg-base-100 shadow shadow-base-100 font-semibold pb-1 mb-1 group inline-block capitalize hover:underline text-base-heading"
					href={addBasePath('/')}
				>
					{homePageName}
				</a>
				{#each firstLevelFiles as file}
					{#if file.children.length === 0 && file.href && (file.frontMatter?.sidebar_link !== false || file.frontMatter?.sidebar_link === undefined)}
						{@const active = $page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
						<a
							class="group inline-block py-1 capitalize transition-all duration-100 {active
								? 'text-primary'
								: 'text-base-content-muted hover:text-base-content'}"
							href={addBasePath(file.href)}
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
								class="sticky top-0 bg-base-100 shadow shadow-base-100 font-semibold pb-1 mb-1 group block capitalize hover:underline text-base-heading"
								href={addBasePath(file.href)}
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
								class="sticky top-0 bg-base-100 shadow shadow-base-100 font-semibold pb-1 mb-1 group inline-block capitalize text-base-heading"
								href={addBasePath(file.href)}
							>
								{file.frontMatter?.title ?? file.label}
								{#if file.frontMatter?.sidebar_badge}
									<Badge>
										{file.frontMatter.sidebar_badge}
									</Badge>
								{/if}
							</span>
						{/if}
						<!-- check if there is an active state for second level headers -->
						{#each file.children as secondLevelFile}
							{#if secondLevelFile.href && (secondLevelFile.frontMatter?.sidebar_link !== false || secondLevelFile.frontMatter?.sidebar_link === undefined)}
								{@const active =
									$page.url.pathname.toUpperCase() === secondLevelFile.href.toUpperCase() + '/'}
								<a
									href={addBasePath(secondLevelFile.href)}
									class="group inline-block py-1 capitalize transition-all duration-100 {active
										? 'text-primary'
										: 'text-base-content-muted hover:text-base-content'}"
								>
									{secondLevelFile.frontMatter?.title ?? secondLevelFile.label}
									{#if secondLevelFile.frontMatter?.sidebar_badge}
										<Badge>
											{secondLevelFile.frontMatter.sidebar_badge}
										</Badge>
									{/if}
								</a>
							{:else}
								<span
									class="group inline-block py-1 capitalize transition-all duration-100 text-base-content-muted font-medium"
								>
									{secondLevelFile.frontMatter?.title ?? secondLevelFile.label}
									{#if secondLevelFile.frontMatter?.sidebar_badge}
										<Badge>
											{secondLevelFile.frontMatter.sidebar_badge}
										</Badge>
									{/if}
								</span>
							{/if}
							{#if secondLevelFile.children.length > 0}
								<div class="flex flex-col">
									{#each secondLevelFile.children as thirdLevelFile}
										{#if thirdLevelFile.href && (thirdLevelFile.frontMatter?.sidebar_link !== false || thirdLevelFile.frontMatter?.sidebar_link === undefined)}
											{@const active =
												$page.url.pathname.toUpperCase() ===
												thirdLevelFile.href.toUpperCase() + '/'}
											<a
												href={addBasePath(thirdLevelFile.href)}
												class="group inline-block py-1 first:pt-0.5 first:mt-1 last:pb-0.5 last:mb-1 pl-3 capitalize transition-all duration-100 border-l ml-1 {active
													? 'text-primary border-primary'
													: 'text-base-content-muted hover:text-base-content hover:border-base-content'}"
											>
												{thirdLevelFile.frontMatter?.title ?? thirdLevelFile.label}
												{#if thirdLevelFile.frontMatter?.sidebar_badge}
													<Badge>
														{thirdLevelFile.frontMatter.sidebar_badge}
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
			{/each}
		</div>
	{/if}
	{#if builtWithEvidence}
		<div class="fixed bottom-0 text-xs py-2">
			<a
				href="https://www.evidence.dev"
				class="bg-gradient-to-r inline-block antialiased font-medium"
			>
				Built with Evidence</a
			>
		</div>
	{/if}
</aside>
