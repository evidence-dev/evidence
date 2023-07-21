<script>
	import { page, navigating } from '$app/stores';
	import { browser } from '$app/environment';

	import { dev } from '$app/environment';
	export let fileTree;
	import { fly, fade } from 'svelte/transition';
	// import { lock, unlock } from 'tua-body-scroll-lock';

	// children of the index page
	let firstLevelFiles = fileTree?.children;

	export let mobileSidebarOpen = false;

	// prevent scrolling of the underlying when the mobile sidebar is open
	const toggleScrollLock = (mobileSidebarOpen) => {
		if (browser) {
			if (!mobileSidebarOpen) {
				// unlock(); // unlock body scroll
			} else {
				// lock(); // lock body scroll
			}
		}
	};

	$: toggleScrollLock(mobileSidebarOpen);
</script>

{#if mobileSidebarOpen}
	<div
		class="fixed inset-0 bg-white/80 z-50 backdrop-blur-sm"
		transition:fade|local={{ duration: 100 }}
		on:click={() => (mobileSidebarOpen = false)}
		on:keypress={() => (mobileSidebarOpen = false)}
	/>
	<div
		class="bg-white border-r border-gray-300 shadow-lg fixed inset-0 z-50 flex sm:w-72 h-screen w-screen flex-col overflow-hidden select-none"
		in:fly|local={{ x: -50, duration: 300 }}
		out:fly|local={{ x: -100, duration: 200 }}
	>
		<div class=" pb-4 text-gray-700">
			<div class="py-3 px-8 mb-6 flex items-start justify-between">
				<a href="/" class="text-gray-800 font-sans text-md tracking-wide font-semibold block">
					evidence
				</a>
				<span
					on:click={() => (mobileSidebarOpen = false)}
					on:keypress={() => (mobileSidebarOpen = false)}
				>
					<button
						type="button"
						class="text-gray-900 hover:bg-gray-50 rounded-lg p-1 transition-all duration-500"
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
			<div class="flex-grow px-8 h-[calc(100vh-8rem)] overflow-auto text-base sm:text-sm">
				<div class="flex flex-col pb-6">
					<a
						class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-200"
						href="/"
					>
						Home
					</a>
					{#each firstLevelFiles as file, href}
						{#if file.children.length === 0}
							<a
								class="hover:text-gray-950 group inline-block py-1 capitalize transition-colors duration-200"
								href={file.href}
								class:selected={$page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
							>
								{file.label}
							</a>
						{/if}
					{/each}
				</div>
				{#each firstLevelFiles as file, href}
					{#if file.children.length > 0}
						<div class="flex flex-col pb-6">
							{#if file.href}
								<a
									class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-200"
									href={file.href}
								>
									{file.label}
								</a>
							{:else}
								<span
									class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-200"
									href={file.href}
								>
									{file.label}
								</span>
							{/if}
							{#each file.children as file, href}
								<a
									class="hover:text-gray-950 group inline-block py-1 capitalize transition-colors duration-200"
									href={file.href}
									class:selected={$page.url.pathname.toUpperCase() ===
										file.href.toUpperCase() + '/'}
								>
									{file.label}
								</a>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Desktop Sidebar -->
<aside class="w-48 hidden md:flex flex-none">
	{#if !mobileSidebarOpen}
		<div class="fixed w-48 top-20 bottom-8 overflow-y-auto flex-1 text-sm text-gray-500">
			<div class="flex flex-col pb-6">
				<a
					class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-all duration-200"
					href="/"
				>
					Home
				</a>
				{#each firstLevelFiles as file, href}
					{#if file.children.length === 0}
						<a
							class="hover:text-gray-950 group inline-block py-1 capitalize transition-all duration-200"
							href={file.href}
							class:selected={$page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
						>
							{file.label}
						</a>
					{/if}
				{/each}
			</div>
			{#each firstLevelFiles as file, href}
				{#if file.children.length > 0}
					<div class="flex flex-col pb-6">
						{#if file.href}
							<a
								class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group block capitalize transition-all duration-200"
								href={file.href}
							>
								{file.label}
							</a>
						{:else}
							<span
								class="sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-all duration-200"
								href={file.href}
							>
								{file.label}
							</span>
						{/if}
						{#each file.children as file, href}
							<a
								class=" group inline-block py-1 capitalize transition-all duration-200 truncate whitespace-break-spaces"
								href={file.href}
								class:selected={$page.url.pathname.toUpperCase() === file.href.toUpperCase() + '/'}
							>
								{file.label}
							</a>
							<!-- Inlining a number in here  -->
							<!-- <div class="flex justify-between items-center gap-3 hover:text-gray-950 pr-3 group">
								<a
									class="text-xs tabular-nums group transition-all duration-200  inline-block group  "
									href={file.href}
									class:selected={$page.url.pathname.toUpperCase() ===
										file.href.toUpperCase() + '/'}
								>
									{(Math.random() * 100).toLocaleString('en-us', {
										minimumFractionDigits: 1,
										maximumFractionDigits: 1
									})}%
								</a>
							</div> -->
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</aside>

<style>
	.selected {
		@apply font-medium text-gray-950;
	}
</style>
