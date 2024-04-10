<script>
	import { dev } from '$app/environment';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { X, Menu2 } from '@steeze-ui/tabler-icons';
	import { Github as GithubLogo, Slack as SlackLogo } from '@steeze-ui/simple-icons';
	import Logo from '../Logo.svelte';
	import AlgoliaDocSearch from './AlgoliaDocSearch.svelte';
	import KebabMenu from './KebabMenu.svelte';
	import DarkModeToggle from './DarkModeToggle.svelte';

	export let mobileSidebarOpen = undefined;
	export let title = undefined;
	export let logo = undefined;
	export let neverShowQueries = undefined;
	export let fullWidth = undefined;
	export let maxWidth = undefined;
	export let hideSidebar = undefined;

	export let algolia = undefined;

	// Social links
	export let githubRepo = undefined;
	export let xProfile = undefined;
	export let slackCommunity = undefined;
</script>

<header
	class="fixed w-full top-0 z-40 flex h-12 shrink-0 justify-start items-center gap-x-4 border-b bg-background/90 backdrop-blur print:hidden"
>
	<div
		class={(fullWidth ? 'max-w-full ' : maxWidth ? '' : ' max-w-7xl ') +
			'mx-auto px-6 sm:px-8 md:px-12 flex flex-1 items-center justify-between'}
		style="max-width:{maxWidth}px;"
	>
		{#if hideSidebar}
			<a href="/" class="block text-sm font-bold text-gray-800">
				<Logo {logo} {title} />
			</a>
		{:else}
			<a href="/" class="hidden md:block text-sm font-bold text-gray-800">
				<Logo {logo} {title} />
			</a>
			<button
				type="button"
				class="text-gray-900 hover:bg-gray-50 rounded-lg p-1 md:hidden transition-all duration-500"
				on:click={() => {
					mobileSidebarOpen = !mobileSidebarOpen;
				}}
			>
				{#if mobileSidebarOpen}
					<span class="sr-only">Close sidebar</span>
					<Icon class="w-5 h-5" src={X} />
				{:else}
					<span class="sr-only">Open sidebar</span>
					<Icon class="w-5 h-5" src={Menu2} />
				{/if}
			</button>
		{/if}
		<div class="flex gap-2 text-sm items-center">
			{#if algolia}
				<AlgoliaDocSearch {algolia} />
			{/if}
			<div class="flex gap-2 items-center">
				{#if githubRepo}
					<a
						href={githubRepo}
						class="hover:bg-gray-50 rounded-lg p-2 transition-all duration-200"
						target="_blank"
						rel="noreferrer"
					>
						<Icon src={GithubLogo} class="w-4 h-4 text-gray-900 " />
					</a>
				{/if}
				{#if xProfile}
					<a
						href={xProfile}
						class="hover:bg-gray-50 rounded-lg p-2 transition-all duration-200"
						target="_blank"
						rel="noreferrer"
					>
						<svg
							role="img"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							class="w-4 h-4 text-gray-900"
							><path
								d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
							/>
						</svg>
					</a>
				{/if}
				{#if slackCommunity}
					<a
						href={slackCommunity}
						class="hover:bg-gray-50 rounded-lg p-2 transition-all duration-200"
						target="_blank"
						rel="noreferrer"
					>
						<Icon src={SlackLogo} class="w-4 h-4 text-gray-900 " />
					</a>
				{/if}
			</div>
			<div class="relative">
				{#if dev || !neverShowQueries}
					<KebabMenu />
				{/if}
			</div>
			<DarkModeToggle />
		</div>
	</div>
</header>
