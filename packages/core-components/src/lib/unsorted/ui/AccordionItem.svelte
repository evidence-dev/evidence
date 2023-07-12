<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onMount } from 'svelte';
	import { ChevronDown, ChevronUp } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';

	export let title = '';

	const accordionContext = getContext('accordion');
	let index;
	let node;
	let content;
	let height = 0;
	let toggled = false;

	accordionContext.activeItem.subscribe((val) => {
		toggled = val === index;
		// calculate height after the DOM has updated
		if (toggled) {
			height = content.scrollHeight;
		} else {
			height = 0;
		}
	});

	onMount(() => {
		const accordionItems = Array.from(document.querySelectorAll('.accordion-item'));
		index = accordionItems.indexOf(node);
	});
</script>

<div bind:this={node} class="accordion-item">
	<button
		on:click={() => accordionContext.setActiveItem(index)}
		class="flex justify-between items-center w-full box-border px-4 bg-white border-none cursor-pointer transition ease-in-out duration-300 hover:bg-gray-100 focus:outline-none"
	>
		<h3 class="text-lg my-3">{title}</h3>
		{#if toggled}
			<Icon src={ChevronUp} class="text-gray-600 w-6 h-6" />
		{:else}
			<Icon src={ChevronDown} class="text-gray-600 w-6 h-6" />
		{/if}
	</button>
	<div
		bind:this={content}
		class="text-base overflow-auto transition-all duration-300 ease-in-out"
		style="height: {height}px"
	>
		<div class="p-5">
			<slot />
		</div>
	</div>
</div>
