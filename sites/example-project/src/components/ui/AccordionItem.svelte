<script>
	import { getContext, onMount } from 'svelte';
	import ChevronToggle from './ChevronToggle.svelte';

	export let title = '';

	const accordionContext = getContext('accordion');
	let index;
	let node;

	let toggled = false;
	accordionContext.activeItem.subscribe((val) => (toggled = val === index));

	onMount(() => {
		const accordionItems = Array.from(document.querySelectorAll('.accordion-item'));
		index = accordionItems.indexOf(node);
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div bind:this={node} on:click={() => accordionContext.setActiveItem(index)} class="accordion-item">
	<button
		class="flex justify-between items-center w-full px-4 py-2 bg-white border-none cursor-pointer transition-colors duration-300 hover:bg-gray-100 focus:outline-none"
	>
		<h3 class="text-lg">{title}</h3>
		<ChevronToggle {toggled} vertical="true" size="20" />
	</button>
	<div
		class="text-base overflow-hidden transition-all duration-300 max-h-0 {toggled
			? 'max-h-80'
			: ''}"
	>
		<div class="p-5">
			<slot />
		</div>
	</div>
</div>
