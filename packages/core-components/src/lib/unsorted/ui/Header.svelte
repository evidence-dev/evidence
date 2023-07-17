<script>
	let dropDownOpen = false;
	export let mobileSidebarOpen;
</script>

<div
	class="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-x-4 border-b border-gray-200/40 bg-white/40 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8"
	class:solid={mobileSidebarOpen}
>
	<div class="flex items-center gap-3">
		<button
			type="button"
			class="text-gray-900 hover:bg-gray-100 rounded-lg p-1 lg:hidden transition-all duration-500"
			on:click={() => {
				mobileSidebarOpen = !mobileSidebarOpen;
			}}
		>
			{#if mobileSidebarOpen}
				<span class="sr-only">Open sidebar</span>

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
				<span class="sr-only">Close sidebar</span>
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
		<div>
			<a href="/" class="font-sans text-md text-gray-800 tracking-wide font-semibold antialiased">
				evidence
			</a>
		</div>
	</div>
	<!-- Separator -->
	<!-- <div class="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" /> -->

	<div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
		<div class="flex items-center gap-x-4 lg:gap-x-6">
			<!-- Separator -->
			<!-- <div class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" /> -->

			<!-- dropdown -->
			{#if dropDownOpen}
				<div class="relative block xl:hidden">
					<button
						type="button"
						class="-m-1.5 flex items-center p-1.5"
						id="user-menu-button"
						aria-expanded="false"
						aria-haspopup="true"
					>
						<span class="sr-only">Open page menu</span>
						<span class="hidden lg:flex lg:items-center">
							<span class="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="w-6 h-6"
								>
									<path
										fill-rule="evenodd"
										d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
						</span>
					</button>
					<div
						class="absolute right-0 z-10 mt-2.5 w-44 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none px-3"
						role="menu"
						aria-orientation="vertical"
						aria-labelledby="user-menu-button"
						tabindex="-1"
					>
						<!-- Active: "bg-gray-50", Not Active: "" -->
						<a
							href="#"
							class="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50 rounded-md"
							role="menuitem"
							tabindex="-1"
							id="user-menu-item-1">Show Queries</a
						>
						<a
							href="#"
							class="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50 rounded-md"
							role="menuitem"
							tabindex="-1"
							id="user-menu-item-1">Settings</a
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>


<style>
	/* conditional styling of the header */
	.solid {
		@apply bg-white border-gray-200 transition-colors duration-200;
	}

</style>