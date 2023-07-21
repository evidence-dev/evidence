<script>
	let dropDownOpen = false;
	export let mobileSidebarOpen;
</script>

<header
	class=" sticky top-0 z-40 flex h-12 shrink-0 justify-start items-center gap-x-4 border-b bg-white/90 backdrop-blur"
>
	<div class="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-1 justify-self-start">
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
	</div>
</header>

<!-- <div class="relative">
	<button
		type="button"
		class="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900"
		aria-expanded="false"
	>
		<span>Solutions</span>
		<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path
				fill-rule="evenodd"
				d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
				clip-rule="evenodd"
			/>
		</svg>
	</button>
	<div class="absolute left-1/2 z-10 mt-5 flex w-screen max-w-min -translate-x-1/2 px-4">
		<div
			class="w-56 shrink border rounded-md bg-white p-1 text-sm leading-6 text-gray-950 shadow-md ring-1 ring-gray-900/5"
		>
			<a href="#" class="block p-2 hover:bg-gray-100 rounded-md transition-colors duration-75"
				>Analytics</a
			>
			<a href="#" class="block p-2 hover:bg-gray-100 rounded-md transition-colors duration-75"
				>Engagement</a
			>
			<a href="#" class="block p-2 hover:bg-gray-100 rounded-md transition-colors duration-75"
				>Security</a
			>
			<a href="#" class="block p-2 hover:bg-gray-100 rounded-md transition-colors duration-75"
				>Integrations</a
			>
			<a href="#" class="block p-2 hover:bg-gray-100 rounded-md transition-colors duration-75"
				>Automations</a
			>
			<a href="#" class="block p-2 hover:bg-gray-100 rounded-md transition-colors duration-75"
				>Reports</a
			>
		</div>
	</div>
</div> -->
