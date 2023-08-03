<script>
	export let mobileSidebarOpen;
	import { showQueries } from '@evidence-dev/component-utilities/stores';
	import { Menu, MenuButton, MenuItems, MenuItem } from '@rgossiaux/svelte-headlessui';
	import { dev } from '$app/environment';
</script>

<header
	class=" sticky top-0 z-40 flex h-12 shrink-0 justify-start items-center gap-x-4 border-b border-gray-200 bg-white/90 backdrop-blur print:hidden"
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
					<MenuButton class="outline-none rounded-md focus:bg-gray-50 hover:bg-gray-100 px-1 py-1"
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
					<MenuItems class="absolute top-12 right-0 z-50 flex max-w-min outline-none">
						<div
							class="shrink w-44 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-md px-1 py-1 text-sm leading-6 text-gray-950 shadow-xl"
						>
							<MenuItem
								let:active
								on:click={() => {
									window.print();
								}}
							>
								<div
									class="w-full text-left py-1 px-2 hover:bg-gray-100/80 rounded-[0.25rem] cursor-pointer"
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
									class="w-full text-left py-1 px-2 hover:bg-gray-100/80 rounded-[0.25rem] cursor-pointer"
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
										class="w-full block text-left py-1 px-2 hover:bg-gray-100/80 rounded-[0.25rem]"
									>
										<div class="flex items-center justify-between">
											<span> Settings </span>
											<span class="text-gray-300">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													class="w-4 h-4"
												>
													<path
														d="M13.024 9.25c.47 0 .827-.433.637-.863a4 4 0 00-4.094-2.364c-.468.05-.665.576-.43.984l1.08 1.868a.75.75 0 00.649.375h2.158zM7.84 7.758c-.236-.408-.79-.5-1.068-.12A3.982 3.982 0 006 10c0 .884.287 1.7.772 2.363.278.38.832.287 1.068-.12l1.078-1.868a.75.75 0 000-.75L7.839 7.758zM9.138 12.993c-.235.408-.039.934.43.984a4 4 0 004.094-2.364c.19-.43-.168-.863-.638-.863h-2.158a.75.75 0 00-.65.375l-1.078 1.868z"
													/>
													<path
														fill-rule="evenodd"
														d="M14.13 4.347l.644-1.117a.75.75 0 00-1.299-.75l-.644 1.116a6.954 6.954 0 00-2.081-.556V1.75a.75.75 0 00-1.5 0v1.29a6.954 6.954 0 00-2.081.556L6.525 2.48a.75.75 0 10-1.3.75l.645 1.117A7.04 7.04 0 004.347 5.87L3.23 5.225a.75.75 0 10-.75 1.3l1.116.644A6.954 6.954 0 003.04 9.25H1.75a.75.75 0 000 1.5h1.29c.078.733.27 1.433.556 2.081l-1.116.645a.75.75 0 10.75 1.298l1.117-.644a7.04 7.04 0 001.523 1.523l-.645 1.117a.75.75 0 101.3.75l.644-1.116a6.954 6.954 0 002.081.556v1.29a.75.75 0 001.5 0v-1.29a6.954 6.954 0 002.081-.556l.645 1.116a.75.75 0 001.299-.75l-.645-1.117a7.042 7.042 0 001.523-1.523l1.117.644a.75.75 0 00.75-1.298l-1.116-.645a6.954 6.954 0 00.556-2.081h1.29a.75.75 0 000-1.5h-1.29a6.954 6.954 0 00-.556-2.081l1.116-.644a.75.75 0 00-.75-1.3l-1.117.645a7.04 7.04 0 00-1.524-1.523zM10 4.5a5.475 5.475 0 00-2.781.754A5.527 5.527 0 005.22 7.277 5.475 5.475 0 004.5 10a5.475 5.475 0 00.752 2.777 5.527 5.527 0 002.028 2.004c.802.458 1.73.719 2.72.719a5.474 5.474 0 002.78-.753 5.527 5.527 0 002.001-2.027c.458-.802.719-1.73.719-2.72a5.475 5.475 0 00-.753-2.78 5.528 5.528 0 00-2.028-2.002A5.475 5.475 0 0010 4.5z"
														clip-rule="evenodd"
													/>
												</svg>
											</span>
										</div>
									</a>
								</MenuItem>
								<MenuItem let:active>
									<a
										href="/settings/#deploy"
										target="_self"
										class:active
										class="w-full block text-left py-1 px-2 hover:bg-gray-100/80 rounded-[0.25rem]"
									>
										<div class="flex items-center justify-between">
											<span> Deploy </span>
											<span class="text-gray-300">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													class="w-4 h-4"
												>
													<path
														fill-rule="evenodd"
														d="M9.638 1.093a.75.75 0 01.724 0l2 1.104a.75.75 0 11-.724 1.313L10 2.607l-1.638.903a.75.75 0 11-.724-1.313l2-1.104zM5.403 4.287a.75.75 0 01-.295 1.019l-.805.444.805.444a.75.75 0 01-.724 1.314L3.5 7.02v.73a.75.75 0 01-1.5 0v-2a.75.75 0 01.388-.657l1.996-1.1a.75.75 0 011.019.294zm9.194 0a.75.75 0 011.02-.295l1.995 1.101A.75.75 0 0118 5.75v2a.75.75 0 01-1.5 0v-.73l-.884.488a.75.75 0 11-.724-1.314l.806-.444-.806-.444a.75.75 0 01-.295-1.02zM7.343 8.284a.75.75 0 011.02-.294L10 8.893l1.638-.903a.75.75 0 11.724 1.313l-1.612.89v1.557a.75.75 0 01-1.5 0v-1.557l-1.612-.89a.75.75 0 01-.295-1.019zM2.75 11.5a.75.75 0 01.75.75v1.557l1.608.887a.75.75 0 01-.724 1.314l-1.996-1.101A.75.75 0 012 14.25v-2a.75.75 0 01.75-.75zm14.5 0a.75.75 0 01.75.75v2a.75.75 0 01-.388.657l-1.996 1.1a.75.75 0 11-.724-1.313l1.608-.887V12.25a.75.75 0 01.75-.75zm-7.25 4a.75.75 0 01.75.75v.73l.888-.49a.75.75 0 01.724 1.313l-2 1.104a.75.75 0 01-.724 0l-2-1.104a.75.75 0 11.724-1.313l.888.49v-.73a.75.75 0 01.75-.75z"
														clip-rule="evenodd"
													/>
												</svg>
											</span>
										</div>
									</a>
								</MenuItem>
								<MenuItem let:active>
									<a
										href="https://docs.evidence.dev"
										target="_blank"
										class:active
										class="w-full block text-left py-1 px-2 hover:bg-gray-100/80 rounded-[0.25rem]"
									>
										<div class="flex items-center justify-between">
											<span> Documentation </span>
											<span class="text-gray-300">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													class="w-4 h-4"
												>
													<path
														d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z"
													/>
													<path
														d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z"
													/>
												</svg>
											</span>
										</div>
									</a>
								</MenuItem>
								<!-- <MenuItem let:active>
									<a
										href="https://docs.evidence.dev"
										target="_blank"
										class:active
										class="w-full block text-left py-1 px-1 hover:bg-gray-100/80 rounded-md"
									>
										<div class="flex items-center justify-between">
											<span> Slack </span>
											<span class="text-gray-300">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													class="w-4 h-4"
												>
													<path
														d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z"
													/>
													<path
														d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z"
													/>
												</svg>
											</span>
										</div>
									</a>
								</MenuItem> -->
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
		@apply bg-gray-100/80;
	}
</style>
