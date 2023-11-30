<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onMount } from 'svelte';
	import { ChevronDown, ChevronUp } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';

	/** @type {string} */
	export let title = '';

	/** @type {boolean} */
	export let small = false;

	const { setActiveItem, activeItem } = getContext('accordion');
	let index;
	let node;

	$: visible = index === $activeItem;
	/** @type {HTMLDivElement} */
	let contentContainer;

	$: contentHeight = contentContainer?.clientHeight ?? '0';

	onMount(() => {
		const accordionItems = Array.from(document.querySelectorAll('.accordion-item'));
		index = accordionItems.indexOf(node);
	});
</script>

<div bind:this={node} class="accordion-item">
	<button
		on:click={() => setActiveItem(index)}
		class="flex justify-between items-center w-full box-border px-4 bg-white border-none cursor-pointer transition ease-in-out duration-300 hover:bg-gray-100 focus:outline-none"
		type="button"
		class:text-lg={!small}
		class:py-3={!small}
		class:py-1={small}
	>
		{#if $$slots.title}
			<slot name="title" />
		{:else}
			<h3>{title}</h3>
		{/if}
		{#if visible}
			<Icon src={ChevronUp} class="text-gray-600 w-6 h-6" />
		{:else}
			<Icon src={ChevronDown} class="text-gray-600 w-6 h-6" />
		{/if}
	</button>
	<div
		class="text-base overflow-auto transition-all duration-300 ease-in-out"
		style="height: {visible ? contentHeight : '0'}px"
	>
		<!-- We can measure this even while it is hidden, because it is "behind" the overflow -->
		<div class="p-5" bind:this={contentContainer}>
			<slot />
		</div>
	</div>
</div>
