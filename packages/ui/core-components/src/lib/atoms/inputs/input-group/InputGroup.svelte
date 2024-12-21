<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Filter } from '@steeze-ui/tabler-icons';

	import { onMount } from 'svelte';

	export let title = 'Inputs';
	let isOpen = false;
	let contentHeight = 0;

	let contentElement;

	function toggle() {
		isOpen = !isOpen;
		updateHeight();
	}

	function updateHeight() {
		if (contentElement) {
			contentHeight = contentElement.scrollHeight;
		}
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver(() => {
			if (isOpen) {
				updateHeight();
			}
		});

		if (contentElement) {
			resizeObserver.observe(contentElement);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="space-y-2 pt-2 px-2">
	<!-- Toggle Button -->
	<button
		class="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none"
		on:click={toggle}
		aria-expanded={isOpen}
	>
		<div class="search-icon">
			<Icon src={Filter} class="pl-0.5 w-4 h-4 text-base-content-muted" />
		</div>
		<span class="text-sm font-medium text-base-content">{title}</span>
		<svg
			class={`w-4 h-4 transform ${isOpen ? 'rotate-180' : ''} transition-transform`}
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Collapsible Content with Transition -->
	<div
		class="overflow-hidden transition-all duration-300 bg-base-200 {isOpen
			? 'border'
			: ''} border-base-300 rounded-md"
		style={`max-height: ${isOpen ? contentHeight + 'px' : '0px'}`}
	>
		<div bind:this={contentElement} class="collapsible-content p-2">
			<slot />
		</div>
	</div>
</div>

<style>
	/* Ensure child margins don't cause visual gaps */
	.collapsible-content > * {
		margin: 0; /* Reset margins */
	}
</style>
