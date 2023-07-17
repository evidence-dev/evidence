<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	import { dev } from '$app/environment';
	import CollapsibleSection from './CollapsibleSection.svelte';
	export let fileTree;
	import { fly, fade } from 'svelte/transition';
	// import { lock, unlock } from 'tua-body-scroll-lock';

	// children of the index page
	let firstLevelFiles = fileTree?.children;

	export let mobileSidebarOpen = false;

	// prevent scrolling of the underlying when the mobile sidebar is open 
	const toggleScrollLock = (mobileSidebarOpen) => {
		if(browser){
			if(!mobileSidebarOpen){
				// unlock(); // unlock body scroll
			} else {
				// lock(); // lock body scroll
			}
		}
	};

	$: toggleScrollLock(mobileSidebarOpen);
</script>

{#if mobileSidebarOpen}
<div class="fixed lg:hidden inset-0 bg-gray-100/40 z-40 backdrop-blur-sm" transition:fade|local={{duration: 200}} on:click={() => mobileSidebarOpen = false} on:keypress={() => mobileSidebarOpen = false}></div>
<div	class="fixed inset-y-12 z-50 flex w-72 flex-col h-full overflow-hidden select-none"	in:fly|local={{ x: -100, duration: 400}}	out:fly|local={{ x: -100, duration: 200}}>
	<div class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white pb-4 pt-6">
		<nav class="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-6">
			<ul class="flex flex-1 flex-col gap-y-7">
				<li>
					<ul class="-mx-2 space-y-1">
						{#each firstLevelFiles as file}
							<li>
								{#if file.children.length > 0}
									<CollapsibleSection folder={file} />
								{:else if file.href}
									<a
										href={file.href}
										class="text-gray-800 hover:bg-gray-50 hover:text-blue-600 group flex gap-x-3 rounded-md p-2 text-sm leading-6 capitalize transition-colors duration-0"
										class:selected={'/' + $page.url.pathname.split('/')[1] === file.href
									}
									>
										{file.label}
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			</ul>
		</nav>
		{#if dev}
		<div class="mt-auto px-6 mb-12">
			<a
				href="/settings"
				class="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors duration-0"
			>
				<svg
					class="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				Settings
			</a>
		</div>
		{/if}
	</div>
</div>

{/if}

<!-- Desktop Sidebar -->
<div
	class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col h-full overflow-hidden select-none"
>
	<div class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white pb-4">
		<div class="flex h-12 w-full shrink-0 items-center px-6">
			<a href="/" class="text-gray-800 font-sans text-md tracking-wide font-semibold"> evidence </a>
		</div>

		<nav class="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-6">
			<ul class="flex flex-1 flex-col gap-y-7">
				<li>
					<ul class="-mx-2 space-y-1">
						{#each firstLevelFiles as file}
							<li>
								{#if file.children.length > 0}
									<CollapsibleSection folder={file} />
								{:else if file.href}
									<a
										href={file.href}
										class="text-gray-800 hover:bg-gray-50 hover:text-blue-600 group flex gap-x-3 rounded-md p-2 text-sm leading-6 capitalize transition-colors duration-0"
										class:selected={'/' + $page.url.pathname.split('/')[1] === file.href}
									>
										{file.label}
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			</ul>
		</nav>
		{#if dev}
			<div class="mt-auto px-6">
				<a
					href="/settings"
					class="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors duration-0"
				>
					<svg
						class="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Settings
				</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.selected {
		@apply bg-gray-50 text-blue-600;
	}
</style>