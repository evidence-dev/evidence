<script>
	export let mobileSidebarOpen;
	import { showQueries } from '@evidence-dev/component-utilities/stores';
	import { Menu, MenuButton, MenuItems, MenuItem } from '@rgossiaux/svelte-headlessui';
	import { dev } from '$app/environment';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Settings, _3dCubeSphere, Link, X, Menu2, Dots, Table } from '@steeze-ui/tabler-icons';
	import Logo from './Logo.svelte';

	const beforeprint = new Event('export-beforeprint');
	const afterprint = new Event('export-afterprint');
	function print() {
		window.dispatchEvent(beforeprint);
		setTimeout(() => window.print(), 0);
		setTimeout(() => window.dispatchEvent(afterprint), 0);
	}
</script>

<header
	class="fixed w-full top-0 z-40 flex h-12 shrink-0 justify-start items-center gap-x-4 border-b border-gray-200 bg-white/90 backdrop-blur print:hidden"
>
	<div
		class="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-1 justify-self-start justify-between items-center"
	>
		<a href="/" class="hidden md:block">
			<Logo />
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
		<div class="flex gap-6 text-sm items-center">
			<div class="relative">
				<Menu class="outline-none">
					<MenuButton class="outline-none rounded-md focus:bg-gray-50 hover:bg-gray-100 px-1 py-1">
						<Icon src={Dots} class="w-6 h-6" />
					</MenuButton>
					<MenuItems class="absolute top-12 right-0 z-50 flex max-w-min outline-none">
						<div
							class="shrink w-44 border border-gray-300 rounded-lg bg-white px-1 py-1 text-sm leading-6 text-gray-950 shadow-xl"
						>
							<MenuItem let:active on:click={print}>
								<div
									class="w-full text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] cursor-pointer"
									class:active
								>
									Print PDF
								</div>
							</MenuItem>

							<MenuItem
								let:active
								on:click={() => {
									showQueries.update((val) => !val);
								}}
							>
								<div
									class="w-full text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] cursor-pointer"
									class:active
								>
									{$showQueries ? 'Hide ' : 'Show '} Queries
								</div>
							</MenuItem>
							{#if dev}
								<hr class="my-1" />
								<MenuItem let:active>
									<a
										href="/settings"
										class:active
										class="w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem]"
									>
										<div class="flex items-center justify-between">
											<span> Settings </span>
											<Icon src={Settings} class="text-gray-300 w-4 h-4" />
										</div>
									</a>
								</MenuItem>
								<MenuItem let:active>
									<a
										href="/settings/#deploy"
										target="_self"
										class:active
										class="w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem]"
									>
										<div class="flex items-center justify-between">
											<span> Deploy </span>
											<Icon src={_3dCubeSphere} class="text-gray-300 h-4 w-4" />
										</div>
									</a>
								</MenuItem>
								<!-- TODO: Hide this when built -->
								<MenuItem let:active>
									<a
										href="/explore/schema"
										target="_self"
										class:active
										class="w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem]"
									>
										<div class="flex items-center justify-between">
											<span> Schema Explorer </span>
											<Icon src={Table} class="text-gray-300 h-4 w-4" />
										</div>
									</a>
								</MenuItem>

								<MenuItem let:active>
									<a
										href="https://docs.evidence.dev"
										target="_blank"
										rel="noreferrer"
										class:active
										class="w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem]"
									>
										<div class="flex items-center justify-between">
											<span> Documentation </span>
											<Icon src={Link} class="text-gray-300 h-4 w-4" />
										</div>
									</a>
								</MenuItem>
							{/if}
						</div>
					</MenuItems>
				</Menu>
			</div>
		</div>
	</div>
</header>

<style>
	.active {
		@apply bg-gray-100;
	}
</style>
