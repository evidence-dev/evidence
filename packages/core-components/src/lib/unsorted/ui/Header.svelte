<script>
	export let mobileSidebarOpen;
	import { showQueries } from '@evidence-dev/component-utilities/stores';
	import { Menu, MenuButton, MenuItems, MenuItem } from '@rgossiaux/svelte-headlessui';
</script>

<header
	class=" sticky top-0 z-40 flex h-12 shrink-0 justify-start items-center gap-x-4 border-b border-gray-200 bg-white/90 backdrop-blur"
>
	<div
		class="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-1 justify-self-start justify-between items-center"
	>
		<a href="/" class="text-gray-800 font-sans text-md tracking-wide font-semibold hidden md:block">
			evidence
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
			{:else}
				<span class="sr-only">Open sidebar</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-5 h-5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			{/if}
		</button>
		<div class="flex gap-6 text-sm items-center">
			<div class="relative">
				<Menu class="outline-none">
					<MenuButton
						class="outline-none rounded-md focus:bg-gray-50 hover:bg-gray-100 px-1 py-1"
						><svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-6 h-6"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
							/>
						</svg>
					</MenuButton>
					<MenuItems
						class="absolute top-12 right-0 z-50 -px-1 flex w-screen max-w-min outline-none"
					>
						<div
							class="shrink w-56 border border-gray-300 rounded-md bg-white/80 backdrop-blur-md px-2 py-2 text-sm leading-6 text-gray-950 shadow-xl"
						>
							<MenuItem
								let:active
								on:click={() => {
									window.print();
								}}
							>
								<div
									class="w-full text-left py-1 px-1 hover:bg-gray-50 rounded-md cursor-pointer"
									class:active
								>
									Print
								</div>
							</MenuItem>

							<MenuItem
								let:active
								on:click={() => {
									showQueries.update((val) => !val);
								}}
							>
								<div
									class="w-full text-left py-1 px-1 hover:bg-gray-50 rounded-md cursor-pointer"
									class:active
								>
									{$showQueries ? 'Hide ' : 'Show '} Queries
								</div>
							</MenuItem>
							<hr class="my-1" />

							<MenuItem let:active>
								<a
									href="/documentation"
									class:active
									class="w-full block text-left py-1 px-1 hover:bg-gray-50 rounded-md"
								>
									Documentation
								</a>
							</MenuItem>
							<MenuItem disabled>
								<span class="disabled">Invite a friend (coming soon!)</span>
							</MenuItem>
						</div>
					</MenuItems>
				</Menu>
				<!-- <button
					type="button"
					class="inline-flex items-center gap-x-1 text-xs leading-6 text-gray-900 hover:bg-gray-50 px-1 py-1 rounded-md transition-colors duration-200"
					aria-expanded="false"
					on:click={() => {
						dropDownOpen = !dropDownOpen;
					}}
				>
					
				</button>
				{#if dropDownOpen}
					<div class="absolute top-12 right-0 z-50 -px-1 flex w-screen max-w-min">
						<div
							class="shrink w-56 border border-gray-300 rounded-md bg-white/80 backdrop-blur-md px-2 py-2 text-sm leading-6 text-gray-950 shadow-xl ring-1 ring-gray-900/5"
						>
							<button class="w-full text-left py-1 px-1 hover:bg-gray-50 rounded-md">Print</button>
							<button
								class="w-full text-left py-1 px-1 hover:bg-gray-50 rounded-md"
								on:click={() => {
									showQueries.update((val) => !val);
								}}
							>
								{$showQueries ? 'Hide ' : 'Show '} Queries
							</button>
							<hr class="my-1" />
							<a href="#" class="block py-1 px-1 hover:bg-gray-50/90 rounded-md">Settings</a>
							<a href="#" class="block py-1 px-1 hover:bg-gray-50/90 rounded-md">Deploy</a>
							<a href="#" class="block py-1 px-1 hover:bg-gray-50/90 rounded-md">Schema</a>
							<hr class="my-1" />
							<a href="#" class="block py-1 px-1 hover:bg-gray-50/90 rounded-md">Docs</a>
							<a href="#" class="block py-1 px-1 hover:bg-gray-50/90 rounded-md">Slack</a>
						</div>
					</div>
				{/if} -->
			</div>
			<!-- {#if dev}
				<div>
					<span class="px-1 text-xs text-gray-800">Dev Mode</span>
					<div class="inline-flex h-2 w-2 bg-green-600 rounded-full justify-center items-center">
						<div class="inline-block h-2 w-2 bg-green-600/30 rounded-full animate-ping" />
					</div>
				</div>
			{/if} -->
		</div>
	</div>
</header>

<style>
	.active {
		@apply bg-gray-50;
	}
</style>
