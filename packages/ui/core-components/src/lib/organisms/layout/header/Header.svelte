<script>
	import { dev } from '$app/environment';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { X, Menu2 } from '@steeze-ui/tabler-icons';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	import {
		Github as GithubLogo,
		Slack as SlackLogo,
		Bluesky as BlueskyLogo,
		X as XLogo
	} from '@steeze-ui/simple-icons';
	import Logo from '../Logo.svelte';
	import AlgoliaDocSearch from './AlgoliaDocSearch.svelte';
	import KebabMenu from './KebabMenu.svelte';

	export let mobileSidebarOpen = undefined;
	export let title = undefined;
	export let logo = undefined;
	export let neverShowQueries = undefined;
	export let fullWidth = undefined;
	export let maxWidth = undefined;
	export let hideSidebar = undefined;
	export let sidebarFrontMatter = undefined;

	export let algolia = undefined;

	// Social links
	export let githubRepo = undefined;
	export let xProfile = undefined;
	export let blueskyProfile = undefined;
	export let slackCommunity = undefined;
</script>

<header
	class="fixed w-full top-0 z-40 flex h-12 shrink-0 justify-start items-center gap-x-4 border-b border-base-300/50 bg-base-100/90 backdrop-blur print:hidden
  {sidebarFrontMatter === 'hide' ? 'md:pl-8' : ''}"
>
	<div
		class={(fullWidth ? 'max-w-full ' : maxWidth ? '' : ' max-w-7xl ') +
			'mx-auto px-6 sm:px-8 md:px-12 flex flex-1 items-center justify-between'}
		style="max-width:{maxWidth}px;"
	>
		{#if hideSidebar || sidebarFrontMatter === 'never'}
			<a href={addBasePath('/')} class="block text-sm font-bold text-base-content">
				<Logo {logo} {title} />
			</a>
		{:else}
			<div class="flex gap-x-4 items-center">
				<button
					type="button"
					class="text-base-content hover:bg-base-200 rounded-lg p-1 transition-all duration-500
          {sidebarFrontMatter === 'hide' ? 'block' : 'md:hidden'}"
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
				<a href={addBasePath('/')} class="text-sm font-bold text-base-content hidden md:block">
					<Logo {logo} {title} />
				</a>
			</div>
		{/if}
		<div class="flex gap-2 text-sm items-center">
			{#if algolia}
				<AlgoliaDocSearch {algolia} />
			{/if}
			<div class="flex gap-2 items-center">
				{#if githubRepo}
					<a
						href={addBasePath(githubRepo)}
						class="hover:bg-base-200 rounded-lg p-2 transition-all duration-200"
						target="_blank"
						rel="noreferrer"
					>
						<Icon src={GithubLogo} class="w-4 h-4 text-base-content" />
					</a>
				{/if}
				{#if xProfile}
					<a
						href={addBasePath(xProfile)}
						class="hover:bg-base-200 rounded-lg p-2 transition-all duration-200"
						target="_blank"
						rel="noreferrer"
					>
						<Icon src={XLogo} class="w-4 h-4 text-base-content" />
					</a>
				{/if}
				{#if blueskyProfile}
					<a
						href={blueskyProfile}
						class="hover:bg-gray-50 rounded-lg p-2 transition-all duration-200"
						target="_blank"
						rel="noreferrer"
					>
						<Icon src={BlueskyLogo} fill="currentColor" class="w-4 h-4 text-base-content " />
					</a>
				{/if}
				{#if slackCommunity}
					<a
						href={addBasePath(slackCommunity)}
						class="hover:bg-base-200 rounded-lg p-2 transition-all duration-200"
						target="_blank"
						rel="noreferrer"
					>
						<Icon src={SlackLogo} class="w-4 h-4 text-base-content " />
					</a>
				{/if}
			</div>
			<div class="relative">
				{#if dev || !neverShowQueries}
					<KebabMenu />
				{/if}
			</div>
		</div>
	</div>
</header>
