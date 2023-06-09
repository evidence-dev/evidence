<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, onMount } from 'svelte';
	import ChevronToggle from './ChevronToggle.svelte';

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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div bind:this={node} on:click={() => accordionContext.setActiveItem(index)} class="accordion-item">
	<button
		class="flex justify-between w-full box-border px-4 pb-2 bg-white border-none cursor-pointer transition ease-in-out duration-300 hover:bg-gray-100 focus:outline-none"
	>
		<h3 class="text-lg">{title}</h3>
		<ChevronToggle {toggled} vertical="true" size="20" />
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
